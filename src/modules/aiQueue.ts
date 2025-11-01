/**
 * AI Communication Queue Module
 * 
 * Manages a queue of instructions/commands from external AI systems
 * that can be sent to the AI agent in VS Code. This allows other
 * applications to communicate with the VS Code AI agent asynchronously.
 * 
 * Use Cases:
 * - External AI agents sending instructions
 * - Multi-agent coordination systems
 * - Automated workflow triggers
 * - Cross-application AI communication
 */

import * as vscode from 'vscode';
import { log } from './logging';
import { LogLevel } from './types';

/**
 * Queue instruction interface
 */
export interface QueueInstruction {
	id: string;
	instruction: string;
	priority: 'low' | 'normal' | 'high' | 'urgent';
	source: string;
	timestamp: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	result?: string;
	error?: string;
	metadata?: Record<string, unknown>;
}

/**
 * In-memory queue storage
 */
let instructionQueue: QueueInstruction[] = [];
let processingActive = false;
let autoProcessEnabled = false;
let autoProcessCallback: ((message: string, context?: unknown) => Promise<boolean>) | undefined;

/**
 * Add instruction to queue
 * @param instruction - The instruction text to send to AI
 * @param source - Source identifier (e.g., 'external-app', 'automation')
 * @param priority - Priority level (default: 'normal')
 * @param metadata - Optional metadata for context
 * @returns The created queue instruction
 */
export function enqueueInstruction(
	instruction: string,
	source: string,
	priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
	metadata?: Record<string, unknown>
): QueueInstruction {
	const queueItem: QueueInstruction = {
		id: generateId(),
		instruction,
		priority,
		source,
		timestamp: new Date().toISOString(),
		status: 'pending',
		metadata
	};
	
	instructionQueue.push(queueItem);
	sortQueueByPriority();
	
	log(LogLevel.INFO, `Enqueued instruction from ${source}`, { id: queueItem.id, priority });
	
	// Trigger auto-process if enabled
	if (autoProcessEnabled && autoProcessCallback) {
		void processNextInstruction(autoProcessCallback);
	}
	
	return queueItem;
}

/**
 * Get all instructions in queue
 * @param status - Optional status filter
 * @returns Array of queue instructions
 */
export function getQueue(status?: 'pending' | 'processing' | 'completed' | 'failed'): QueueInstruction[] {
	if (status) {
		return instructionQueue.filter(item => item.status === status);
	}
	return [...instructionQueue];
}

/**
 * Get a specific instruction by ID
 * @param id - Instruction ID
 * @returns Queue instruction or undefined
 */
export function getInstruction(id: string): QueueInstruction | undefined {
	return instructionQueue.find(item => item.id === id);
}

/**
 * Remove instruction from queue
 * @param id - Instruction ID
 * @returns true if removed, false if not found
 */
export function removeInstruction(id: string): boolean {
	const index = instructionQueue.findIndex(item => item.id === id);
	if (index !== -1) {
		instructionQueue.splice(index, 1);
		log(LogLevel.INFO, `Removed instruction from queue: ${id}`);
		return true;
	}
	return false;
}

/**
 * Clear completed and failed instructions
 * @returns Number of instructions cleared
 */
export function clearProcessed(): number {
	const beforeLength = instructionQueue.length;
	instructionQueue = instructionQueue.filter(
		item => item.status === 'pending' || item.status === 'processing'
	);
	const cleared = beforeLength - instructionQueue.length;
	log(LogLevel.INFO, `Cleared ${cleared} processed instructions`);
	return cleared;
}

/**
 * Clear all instructions from queue
 */
export function clearQueue(): void {
	const count = instructionQueue.length;
	instructionQueue = [];
	log(LogLevel.INFO, `Cleared all ${count} instructions from queue`);
}

/**
 * Process next pending instruction
 * @param sendToAgent - Function to send message to AI agent
 * @returns true if instruction was processed, false if queue is empty
 */
export async function processNextInstruction(
	sendToAgent?: (message: string, context?: unknown) => Promise<boolean>
): Promise<boolean> {
	if (processingActive) {
		log(LogLevel.WARN, 'Already processing an instruction');
		return false;
	}
	
	const pending = instructionQueue.find(item => item.status === 'pending');
	if (!pending) {
		return false;
	}
	
	processingActive = true;
	pending.status = 'processing';
	
	try {
		log(LogLevel.INFO, `Processing instruction: ${pending.id}`);
		
		if (sendToAgent) {
			const success = await sendToAgent(pending.instruction, {
				source: pending.source,
				queueId: pending.id,
				priority: pending.priority,
				metadata: pending.metadata
			});
			
			if (success) {
				pending.status = 'completed';
				pending.result = 'Sent to AI agent successfully';
			} else {
				pending.status = 'failed';
				pending.error = 'Failed to send to AI agent';
			}
		} else {
			// If no sendToAgent function, just mark as completed
			// (useful for testing or manual processing)
			pending.status = 'completed';
			pending.result = 'Marked as processed (no agent function provided)';
		}
		
		log(LogLevel.INFO, `Instruction ${pending.status}: ${pending.id}`);
		
	} catch (error) {
		pending.status = 'failed';
		pending.error = error instanceof Error ? error.message : String(error);
		log(LogLevel.ERROR, `Error processing instruction ${pending.id}`, { error: pending.error });
	} finally {
		processingActive = false;
	}
	
	return true;
}

/**
 * Process all pending instructions
 * @param sendToAgent - Function to send message to AI agent
 * @returns Number of instructions processed
 */
export async function processAllInstructions(
	sendToAgent: (message: string, context?: unknown) => Promise<boolean>
): Promise<number> {
	let processed = 0;
	
	while (getQueue('pending').length > 0 && !processingActive) {
		const success = await processNextInstruction(sendToAgent);
		if (success) {
			processed++;
			// Small delay between instructions to avoid overwhelming the agent
			await new Promise(resolve => setTimeout(resolve, 500));
		} else {
			break;
		}
	}
	
	log(LogLevel.INFO, `Processed ${processed} instructions`);
	return processed;
}

/**
 * Enable or disable auto-processing of queue
 * @param enabled - true to enable, false to disable
 * @param sendToAgent - Function to send message to AI agent (required if enabling)
 */
export function setAutoProcess(
	enabled: boolean,
	sendToAgent?: (message: string, context?: unknown) => Promise<boolean>
): void {
	autoProcessEnabled = enabled;
	autoProcessCallback = enabled ? sendToAgent : undefined;
	log(LogLevel.INFO, `Auto-process ${enabled ? 'enabled' : 'disabled'}`);
	
	if (enabled && sendToAgent) {
		// Start processing if there are pending instructions
		void processAllInstructions(sendToAgent);
	}
}

/**
 * Get queue statistics
 * @returns Object with queue statistics
 */
export function getQueueStats(): {
	total: number;
	pending: number;
	processing: number;
	completed: number;
	failed: number;
	autoProcessEnabled: boolean;
} {
	return {
		total: instructionQueue.length,
		pending: instructionQueue.filter(i => i.status === 'pending').length,
		processing: instructionQueue.filter(i => i.status === 'processing').length,
		completed: instructionQueue.filter(i => i.status === 'completed').length,
		failed: instructionQueue.filter(i => i.status === 'failed').length,
		autoProcessEnabled
	};
}

/**
 * Sort queue by priority (urgent > high > normal > low)
 */
function sortQueueByPriority(): void {
	const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
	instructionQueue.sort((a, b) => {
		// First by status (pending first)
		if (a.status === 'pending' && b.status !== 'pending') {
			return -1;
		}
		if (a.status !== 'pending' && b.status === 'pending') {
			return 1;
		}
		
		// Then by priority
		const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
		if (priorityDiff !== 0) {
			return priorityDiff;
		}
		
		// Finally by timestamp (older first)
		return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
	});
}

/**
 * Generate unique ID for instruction
 */
function generateId(): string {
	return `ai-queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
