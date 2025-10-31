/**
 * Port management module for automatic port assignment
 * Tracks which ports are in use across all VS Code windows
 */
import * as vscode from 'vscode';
import * as http from 'http';
import { log } from './logging';
import { LogLevel } from './types';

const PORT_REGISTRY_KEY = 'aiFeedbackBridge.portRegistry';
const BASE_PORT = 3737;
const MAX_PORT_SEARCH = 50; // Try up to 50 ports

interface PortRegistryEntry {
	port: number;
	workspace: string;
	timestamp: number;
}

/**
 * Get the port registry from global state
 */
async function getPortRegistry(context: vscode.ExtensionContext): Promise<PortRegistryEntry[]> {
	return context.globalState.get<PortRegistryEntry[]>(PORT_REGISTRY_KEY, []);
}

/**
 * Save the port registry to global state
 */
async function savePortRegistry(context: vscode.ExtensionContext, registry: PortRegistryEntry[]): Promise<void> {
	await context.globalState.update(PORT_REGISTRY_KEY, registry);
}

/**
 * Find an available port for the current workspace
 */
export async function findAvailablePort(context: vscode.ExtensionContext): Promise<number> {
	const registry = await getPortRegistry(context);
	const workspaceName = vscode.workspace.name || 'No Workspace';
	const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'no-workspace';
	
	// Clean up stale entries (older than 1 hour - window likely closed)
	const oneHourAgo = Date.now() - (60 * 60 * 1000);
	const activeRegistry = registry.filter(entry => entry.timestamp > oneHourAgo);
	
	// Check if this workspace already has a port assigned
	const existingEntry = activeRegistry.find(entry => entry.workspace === workspaceId);
	if (existingEntry) {
		log(LogLevel.INFO, `Reusing existing port ${existingEntry.port} for workspace`);
		// Update timestamp
		existingEntry.timestamp = Date.now();
		await savePortRegistry(context, activeRegistry);
		return existingEntry.port;
	}
	
	// Find next available port
	const usedPorts = new Set(activeRegistry.map(e => e.port));
	let port = BASE_PORT;
	
	for (let i = 0; i < MAX_PORT_SEARCH; i++) {
		const candidatePort = BASE_PORT + i;
		if (!usedPorts.has(candidatePort)) {
			// Check if port is actually available using a quick bind test
			const isAvailable = await isPortAvailable(candidatePort);
			if (isAvailable) {
				port = candidatePort;
				break;
			}
		}
	}
	
	// Register this port
	activeRegistry.push({
		port,
		workspace: workspaceId,
		timestamp: Date.now()
	});
	
	await savePortRegistry(context, activeRegistry);
	log(LogLevel.INFO, `Auto-assigned port ${port} for workspace: ${workspaceName}`);
	
	return port;
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const testServer = http.createServer();
		
		testServer.once('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'EADDRINUSE') {
				resolve(false);
			} else {
				resolve(true); // Other errors, assume available
			}
		});
		
		testServer.once('listening', () => {
			testServer.close();
			resolve(true);
		});
		
		testServer.listen(port);
	});
}

/**
 * Release a port from the registry
 */
export async function releasePort(context: vscode.ExtensionContext, port: number): Promise<void> {
	const registry = await getPortRegistry(context);
	const workspaceId = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'no-workspace';
	
	const filtered = registry.filter(entry => 
		!(entry.port === port && entry.workspace === workspaceId)
	);
	
	await savePortRegistry(context, filtered);
	log(LogLevel.INFO, `Released port ${port}`);
}
