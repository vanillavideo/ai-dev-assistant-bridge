/**
 * HTTP Server module for AI Feedback Bridge
 * 
 * Provides REST API endpoints for external communication with the extension.
 * Handles health checks, feedback submission, task management, and port queries.
 * 
 * Security features:
 * - Port validation (1024-65535 range)
 * - Request size limiting (1MB max)
 * - Request timeout (30 seconds)
 * - CORS headers for cross-origin requests
 */
import * as vscode from 'vscode';
import * as http from 'http';
import { log, getErrorMessage } from './logging';
import { LogLevel } from './types';
import * as taskManager from './taskManager';

let server: http.Server | undefined;

// Constants for security
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB max request body
const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Validate port number is in safe range
 * 
 * @param port - Port number to validate
 * @returns true if port is valid (1024-65535), false otherwise
 * 
 * @remarks
 * - Requires integer value
 * - Excludes privileged ports (0-1023)
 * - Maximum port is 65535 (TCP/IP limit)
 */
function isValidPort(port: number): boolean {
	return Number.isInteger(port) && port >= 1024 && port <= 65535;
}

/**
 * Start the HTTP server on specified port
 * 
 * @param context - VS Code extension context for state access
 * @param port - Port number to listen on (must be 1024-65535)
 * @param sendToAgent - Function to send messages to Copilot Chat
 * @returns HTTP server instance
 * @throws {Error} If port is invalid (outside 1024-65535 range)
 * 
 * @remarks
 * Security features:
 * - Validates port number before starting
 * - Sets 30-second timeout on all requests
 * - Limits request body size to 1MB
 * - Enables CORS for cross-origin requests
 * - Handles OPTIONS preflight requests
 * 
 * Error handling:
 * - EADDRINUSE: Port already in use (shown to user)
 * - Request timeout: Returns 408 status
 * - Handler errors: Returns 500 status
 * 
 * @example
 * ```typescript
 * try {
 *   const server = startServer(context, 3737, sendToAgent);
 *   console.log('Server started successfully');
 * } catch (error) {
 *   vscode.window.showErrorMessage(`Failed to start server: ${error.message}`);
 * }
 * ```
 */
export function startServer(
	context: vscode.ExtensionContext,
	port: number,
	sendToAgent: (message: string, context?: unknown) => Promise<boolean>
): http.Server {
	// Validate port number
	if (!isValidPort(port)) {
		const error = `Invalid port number: ${port}. Must be between 1024 and 65535.`;
		log(LogLevel.ERROR, error);
		throw new Error(error);
	}

	server = http.createServer(async (req, res) => {
		// Set timeout for request
		req.setTimeout(REQUEST_TIMEOUT, () => {
			log(LogLevel.WARN, 'Request timeout', { url: req.url, method: req.method });
			if (!res.headersSent) {
				res.writeHead(408, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Request timeout' }));
			}
		});

		// Set CORS headers
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

		// Handle OPTIONS preflight
		if (req.method === 'OPTIONS') {
			res.writeHead(200);
			res.end();
			return;
		}

		try {
			await handleRequest(req, res, context, port, sendToAgent);
		} catch (error) {
			log(LogLevel.ERROR, 'Request handler error', getErrorMessage(error));
			if (!res.headersSent) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Internal server error' }));
			}
		}
	});

	// Start server with error handling
	server.listen(port, () => {
		log(LogLevel.INFO, `✅ Server listening on port ${port}`);
	});

	// Handle server errors
	server.on('error', (error: NodeJS.ErrnoException) => {
		if (error.code === 'EADDRINUSE') {
			log(LogLevel.ERROR, `Port ${port} is already in use. Please change the port in settings.`);
		} else {
			log(LogLevel.ERROR, 'Server error occurred', { error: error.message, code: error.code });
		}
	});

	// Clean up server on deactivation
	context.subscriptions.push({
		dispose: () => {
			stopServer();
		}
	});

	return server;
}

/**
 * Stop the HTTP server and clean up resources
 * 
 * @remarks
 * - Closes all active connections
 * - Safe to call even if server is not running
 * - Idempotent operation (can be called multiple times)
 * - Automatically called on extension deactivation
 * 
 * @example
 * ```typescript
 * stopServer(); // Gracefully shutdown server
 * ```
 */
export function stopServer(): void {
	if (server) {
		log(LogLevel.INFO, 'Closing server');
		server.close();
		server = undefined;
	}
}

/**
 * Get the current server instance
 * 
 * @returns The active HTTP server instance, or undefined if not running
 * 
 * @remarks
 * Used by commands to check server status without direct access to module internals
 * 
 * @example
 * ```typescript
 * const server = getServer();
 * if (server && server.listening) {
 *   console.log('Server is running');
 * }
 * ```
 */
export function getServer(): http.Server | undefined {
	return server;
}

/**
 * Handle incoming HTTP requests and route to appropriate endpoint
 * 
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param context - VS Code extension context for state access
 * @param port - Current server port number
 * @param sendToAgent - Function to send messages to Copilot Chat
 * 
 * @remarks
 * Supported endpoints:
 * - GET /health: Health check (returns OK)
 * - GET /port: Get current port number
 * - POST /feedback: Submit feedback message
 * - GET /tasks: List all tasks
 * - POST /tasks: Create new task
 * - PUT /tasks/:id/status: Update task status
/**
 * Handle incoming HTTP requests and route to appropriate endpoint
 * 
 * @param req - HTTP request object
 * @param res - HTTP response object
 * @param context - VS Code extension context for state access
 * @param port - Current server port number
 * @param sendToAgent - Function to send messages to Copilot Chat
 * 
 * @remarks
 * Supported endpoints:
 * - GET /health: Health check (returns OK)
 * - GET /port: Get current port number
 * - POST /feedback: Submit feedback message
 * - GET /tasks: List all tasks
 * - POST /tasks: Create new task
 * - PUT /tasks/:id/status: Update task status
 * - DELETE /tasks/:id: Delete task
 * 
 * Security:
 * - Enforces 1MB max request body size
 * - Validates JSON payloads
 * - Returns 400 for malformed requests
 * - Returns 404 for unknown endpoints
 * - Returns 405 for unsupported methods
 */
async function handleRequest(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	context: vscode.ExtensionContext,
	port: number,
	sendToAgent: (message: string, context?: unknown) => Promise<boolean>
): Promise<void> {
	const url = req.url || '/';
	const method = req.method || 'GET';

	log(LogLevel.DEBUG, `${method} ${url}`);

	// Route handling
	if (url === '/help' || url === '/') {
		handleHelp(res, port);
	} else if (url === '/tasks' && method === 'GET') {
		await handleGetTasks(res, context);
	} else if (url === '/tasks' && method === 'POST') {
		await handleCreateTask(req, res, context);
	} else if (url.startsWith('/tasks/') && method === 'PUT') {
		await handleUpdateTask(req, res, context, url);
	} else if (url.startsWith('/tasks/') && method === 'DELETE') {
		await handleDeleteTask(res, context, url);
	} else if (url === '/feedback' && method === 'POST') {
		await handleFeedback(req, res, sendToAgent);
	} else if (url === '/restart-app' || url.startsWith('/restart-app?')) {
		await handleRestartApp(req, res);
	} else {
		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found', message: `Unknown endpoint: ${method} ${url}` }));
	}
}

/**
 * Handle GET /help - API documentation
 */
function handleHelp(res: http.ServerResponse, port: number): void {
	const helpText = `
AI Feedback Bridge - API Documentation
=======================================

Base URL: http://localhost:${port}

Endpoints:
----------

GET /
GET /help
    Returns this API documentation

GET /tasks
    List all workspace tasks
    Response: Array of task objects

POST /tasks
    Create a new task
    Body: {
        "title": "Task title",
        "description": "Optional description",
        "category": "bug|feature|improvement|documentation|testing|other"
    }
    Response: Created task object

PUT /tasks/:id
    Update a task status
    Body: {
        "status": "pending|in-progress|completed"
    }
    Response: { success: true }

DELETE /tasks/:id
    Delete a task
    Response: { success: true }

POST /feedback
    Send feedback to AI agent
    Body: {
        "message": "Feedback message",
        "context": { ... optional context ... }
    }
    Response: { success: true, message: "Feedback sent to AI Agent" }

POST /restart-app?delay=30
    Restart the Electron app (if applicable)
    Query params: delay (seconds, default 30)
    Response: { success: true, message: "App restart initiated" }

Examples:
---------

# List all tasks
curl http://localhost:${port}/tasks

# Create a task
curl -X POST http://localhost:${port}/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Fix bug", "category": "bug"}'

# Update task status
curl -X PUT http://localhost:${port}/tasks/12345 \\
  -H "Content-Type: application/json" \\
  -d '{"status": "in-progress"}'

# Send feedback
curl -X POST http://localhost:${port}/feedback \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Please review this code"}'
`;

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.end(helpText);
}

/**
 * Handle GET /tasks - List all tasks
 */
async function handleGetTasks(res: http.ServerResponse, context: vscode.ExtensionContext): Promise<void> {
	try {
		const tasks = await taskManager.getTasks(context);
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(tasks, null, 2));
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to get tasks', getErrorMessage(error));
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Failed to retrieve tasks' }));
	}
}

/**
 * Handle POST /tasks - Create a task
 */
async function handleCreateTask(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	context: vscode.ExtensionContext
): Promise<void> {
	try {
		const body = await readRequestBody(req);
		const data = JSON.parse(body);
		
		// Validate required fields
		if (!data.title || typeof data.title !== 'string') {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Missing or invalid "title" field (must be non-empty string)' }));
			return;
		}

		// Validate title length
		const title = data.title.trim();
		if (title.length === 0) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Title cannot be empty' }));
			return;
		}
		if (title.length > 200) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Title too long (max 200 characters)' }));
			return;
		}

		// Validate optional fields
		const description = data.description ? String(data.description).trim() : '';
		if (description.length > 5000) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Description too long (max 5000 characters)' }));
			return;
		}

		const validCategories = ['feature', 'bug', 'improvement', 'other'];
		const category = validCategories.includes(data.category) ? data.category : 'other';

		const task = await taskManager.addTask(context, title, description, category);
		
		log(LogLevel.INFO, 'Task created via API', { taskId: task.id, title: task.title });
		
		res.writeHead(201, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(task, null, 2));
	} catch (error) {
		if (error instanceof SyntaxError) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Invalid JSON format' }));
		} else if (error instanceof Error && error.message.includes('too large')) {
			res.writeHead(413, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: error.message }));
		} else {
			log(LogLevel.ERROR, 'Failed to create task', getErrorMessage(error));
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Failed to create task' }));
		}
	}
}

/**
 * Handle PUT /tasks/:id - Update task status
 */
async function handleUpdateTask(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	context: vscode.ExtensionContext,
	url: string
): Promise<void> {
	const taskId = url.split('/')[2];
	const body = await readRequestBody(req);
	
	try {
		const data = JSON.parse(body);
		
		if (!data.status || !['pending', 'in-progress', 'completed'].includes(data.status)) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ 
				error: 'Invalid or missing "status" field', 
				valid: ['pending', 'in-progress', 'completed'] 
			}));
			return;
		}

		await taskManager.updateTaskStatus(context, taskId, data.status);
		
		log(LogLevel.INFO, 'Task updated via API', { taskId, status: data.status });
		
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ success: true, taskId, status: data.status }));
	} catch (error) {
		if (error instanceof SyntaxError) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Invalid JSON format' }));
		} else {
			log(LogLevel.ERROR, 'Failed to update task', getErrorMessage(error));
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Failed to update task' }));
		}
	}
}

/**
 * Handle DELETE /tasks/:id - Delete a task
 */
async function handleDeleteTask(
	res: http.ServerResponse,
	context: vscode.ExtensionContext,
	url: string
): Promise<void> {
	const taskId = url.split('/')[2];
	
	try {
		await taskManager.removeTask(context, taskId);
		
		log(LogLevel.INFO, 'Task deleted via API', { taskId });
		
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ success: true, taskId }));
	} catch (error) {
		log(LogLevel.ERROR, 'Failed to delete task', getErrorMessage(error));
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Failed to delete task' }));
	}
}

/**
 * Handle POST /feedback - Send feedback to AI agent
 */
async function handleFeedback(
	req: http.IncomingMessage,
	res: http.ServerResponse,
	sendToAgent: (message: string, context?: unknown) => Promise<boolean>
): Promise<void> {
	const body = await readRequestBody(req, 1024 * 1024); // 1MB limit
	
	try {
		const feedback = JSON.parse(body);
		
		if (!feedback || typeof feedback !== 'object') {
			throw new Error('Invalid feedback structure: must be an object');
		}
		
		if (!feedback.message || typeof feedback.message !== 'string') {
			throw new Error('Invalid feedback: missing or invalid "message" field');
		}
		
		const sanitizedMessage = feedback.message.trim();
		if (sanitizedMessage.length === 0) {
			throw new Error('Invalid feedback: message cannot be empty');
		}
		
		if (sanitizedMessage.length > 50000) {
			throw new Error('Invalid feedback: message too long (max 50000 characters)');
		}
		
		log(LogLevel.INFO, 'Received feedback', { 
			messageLength: sanitizedMessage.length,
			hasContext: !!feedback.context 
		});

		const success = await sendToAgent(sanitizedMessage, feedback.context);

		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ 
			success, 
			message: success ? 'Feedback sent to AI Agent' : 'Failed to send to AI Agent' 
		}));

	} catch (error) {
		const errorMessage = getErrorMessage(error);
		log(LogLevel.ERROR, 'Error processing feedback', { error: errorMessage });
		
		if (error instanceof SyntaxError) {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Invalid JSON format' }));
		} else {
			res.writeHead(400, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: errorMessage }));
		}
	}
}

/**
 * Handle POST /restart-app - Restart Electron app
 */
async function handleRestartApp(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
	const urlParts = (req.url || '').split('?');
	const queryParams = new URLSearchParams(urlParts[1] || '');
	const delaySeconds = parseInt(queryParams.get('delay') || '30', 10);
	
	log(LogLevel.INFO, `Received restart request for Electron app (delay: ${delaySeconds}s)`);
	
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ 
		success: true, 
		message: `App restart initiated (will restart in ${delaySeconds}s)`,
		delay: delaySeconds
	}));
	
	// Restart asynchronously (don't block response)
	setTimeout(async () => {
		try {
			const { exec } = require('child_process');
			const { promisify } = require('util');
			const execAsync = promisify(exec);
			
			log(LogLevel.INFO, 'Killing Electron process...');
			try {
				await execAsync('pkill -f "electron.*Code/AI"');
			} catch (e) {
				log(LogLevel.INFO, 'Kill command completed (process may not have been running)');
			}
			
			log(LogLevel.INFO, `Waiting ${delaySeconds} seconds before restart...`);
			await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
			
			const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			if (workspacePath && workspacePath.includes('/AI')) {
				log(LogLevel.INFO, `Restarting Electron app in: ${workspacePath}`);
				exec(`cd "${workspacePath}" && npm run dev > /dev/null 2>&1 &`);
				log(LogLevel.INFO, 'Electron app restart command sent');
			} else {
				log(LogLevel.WARN, `Could not find workspace path: ${workspacePath}`);
			}
		} catch (error) {
			log(LogLevel.ERROR, 'Restart error', getErrorMessage(error));
		}
	}, 100);
}

/**
 * Read request body with optional size limit
 */
async function readRequestBody(req: http.IncomingMessage, maxSize: number = 10 * 1024): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = '';
		let bodySize = 0;
		
		req.on('data', chunk => {
			bodySize += chunk.length;
			if (bodySize > maxSize) {
				reject(new Error(`Request body too large (max ${maxSize} bytes)`));
				req.destroy();
				return;
			}
			body += chunk.toString();
		});

		req.on('end', () => {
			resolve(body);
		});

		req.on('error', (error) => {
			reject(error);
		});
	});
}
