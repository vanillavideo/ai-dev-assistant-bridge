/**
 * Guiding Documents Module
 * 
 * Manages project-specific documents that provide context to AI agents.
 * Allows users to specify files like ARCHITECTURE.md, CONVENTIONS.md, etc.
 * that should be included in AI prompts for better context-aware responses.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './logging';
import { LogLevel } from './types';
import { validatePath } from './pathValidation';

/**
 * Get the list of guiding documents from workspace configuration
 * @returns Array of absolute file paths
 */
export function getGuidingDocuments(): string[] {
	const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
	const docs = config.get<string[]>('guidingDocuments', []);
	return docs;
}

/**
 * Add a guiding document to the configuration
 * @param filePath - Absolute path to the document
 */
export async function addGuidingDocument(filePath: string): Promise<void> {
	const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
	const docs = config.get<string[]>('guidingDocuments', []);

	// Validate path using pathValidation module
	const validation = validatePath(filePath);
	if (!validation.valid) {
		log(LogLevel.WARN, `Invalid guiding document path: ${validation.error}`);
		throw new Error(validation.error || 'Invalid file path');
	}

	// Convert to workspace-relative path if possible
	const relativePath = getRelativePath(filePath);

	// Check if already exists
	if (docs.includes(relativePath)) {
		log(LogLevel.INFO, `Document already added: ${relativePath}`);
		return;
	}

	docs.push(relativePath);

	// Choose target: prefer Workspace settings when available, otherwise use Global
	const target = vscode.workspace.workspaceFolders ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
	await config.update('guidingDocuments', docs, target);
	log(LogLevel.INFO, `Added guiding document: ${relativePath} (target=${target})`);
}

/**
 * Remove a guiding document from the configuration
 * @param filePath - Path to remove (can be relative or absolute)
 */
export async function removeGuidingDocument(filePath: string): Promise<void> {
	const config = vscode.workspace.getConfiguration('aiDevAssistantBridge');
	const docs = config.get<string[]>('guidingDocuments', []);

	// Normalize provided path to match stored entries (which may be relative or absolute)
	const targetRelative = getRelativePath(filePath);
	const targetAbsolute = getAbsolutePath(filePath);

	const filtered = docs.filter(doc => {
		// Resolve stored doc to absolute for robust comparison
		const storedAbsolute = getAbsolutePath(doc);
		return doc !== targetRelative && doc !== filePath && storedAbsolute !== targetAbsolute;
	});

	if (filtered.length === docs.length) {
		// Not found - log and exit silently
		log(LogLevel.WARN, `Document not found: ${filePath}`);
		return;
	}

	// Choose target: prefer Workspace settings when available, otherwise use Global
	const target = vscode.workspace.workspaceFolders ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
	await config.update('guidingDocuments', filtered, target);
	log(LogLevel.INFO, `Removed guiding document: ${filePath} (target=${target})`);
}

/**
 * Read and format all guiding documents for inclusion in AI context
 * Returns concise references instead of full content to reduce token usage
 * @returns Formatted string with document references
 */
export async function getGuidingDocumentsContext(): Promise<string> {
	const docs = getGuidingDocuments();
	
	if (docs.length === 0) {
		return '';
	}
	
	const references: string[] = [];
	
	for (const docPath of docs) {
		try {
			const absolutePath = getAbsolutePath(docPath);
			
			// Check if file exists
			if (!fs.existsSync(absolutePath)) {
				log(LogLevel.WARN, `Guiding document not found: ${docPath}`);
				continue;
			}
			
			// Use relative path for cleaner reference
			references.push(`- ${docPath}`);
			
		} catch (error) {
			log(LogLevel.ERROR, `Error processing guiding document ${docPath}: ${error}`);
		}
	}
	
	if (references.length === 0) {
		return '';
	}

	// Return concise reference format
	return '\n\n# Guiding Documents\n\nRefer to these documents for context:\n' + references.join('\n');
}

/**
 * Convert absolute path to workspace-relative path if in workspace
 * @param absolutePath - Absolute file path
 * @returns Relative path if in workspace, otherwise absolute path
 */
function getRelativePath(absolutePath: string): string {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return absolutePath;
	}
	
	const workspacePath = workspaceFolder.uri.fsPath;
	if (absolutePath.startsWith(workspacePath)) {
		return path.relative(workspacePath, absolutePath);
	}
	
	return absolutePath;
}

/**
 * Convert workspace-relative path to absolute path
 * @param relativePath - Relative or absolute file path
 * @returns Absolute path
 */
function getAbsolutePath(relativePath: string): string {
	// If already absolute, return as-is
	if (path.isAbsolute(relativePath)) {
		return relativePath;
	}
	
	// Otherwise, resolve relative to workspace
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return relativePath;
	}
	
	return path.join(workspaceFolder.uri.fsPath, relativePath);
}

/**
 * Show file picker to add a guiding document
 */
export async function showAddDocumentPicker(): Promise<void> {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	
	const fileUri = await vscode.window.showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: false,
		openLabel: 'Add Guiding Document',
		defaultUri: workspaceFolder?.uri,
		filters: {
			'Markdown': ['md', 'markdown'],
			'Text': ['txt'],
			'All Files': ['*']
		}
	});
	
	if (fileUri && fileUri[0]) {
		await addGuidingDocument(fileUri[0].fsPath);
	}
}

/**
 * Show quick pick to remove a guiding document
 */
export async function showRemoveDocumentPicker(): Promise<void> {
	const docs = getGuidingDocuments();
	
	if (docs.length === 0) {
		// Silent: nothing to remove
		log(LogLevel.INFO, 'showRemoveDocumentPicker called but no guiding documents configured');
		return;
	}
	
	const items = docs.map(doc => ({
		label: path.basename(doc),
		description: doc,
		detail: getAbsolutePath(doc)
	}));
	
	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select a document to remove',
		matchOnDescription: true,
		matchOnDetail: true
	});
	
	if (selected) {
		await removeGuidingDocument(selected.description);
	}
}

/**
 * Show quick pick list of all guiding documents
 */
export async function showGuidingDocumentsList(): Promise<void> {
	const docs = getGuidingDocuments();
	
	if (docs.length === 0) {
		const action = await vscode.window.showInformationMessage(
			'No guiding documents configured. Would you like to add one?',
			'Add Document',
			'Cancel'
		);
		
		if (action === 'Add Document') {
			await showAddDocumentPicker();
		}
		return;
	}
	
	const items = docs.map((doc, index) => {
		const absolutePath = getAbsolutePath(doc);
		const exists = fs.existsSync(absolutePath);
		return {
			label: `$(file) ${path.basename(doc)}`,
			description: doc,
			detail: exists ? absolutePath : `⚠️ File not found: ${absolutePath}`,
			filePath: doc
		};
	});
	
	items.push({
		label: '$(add) Add Document',
		description: '',
		detail: 'Add a new guiding document',
		filePath: '__add__'
	});
	
	items.push({
		label: '$(trash) Remove Document',
		description: '',
		detail: 'Remove a guiding document',
		filePath: '__remove__'
	});
	
	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Guiding Documents - Project context for AI',
		matchOnDescription: true,
		matchOnDetail: true
	});
	
	if (selected) {
		if (selected.filePath === '__add__') {
			await showAddDocumentPicker();
		} else if (selected.filePath === '__remove__') {
			await showRemoveDocumentPicker();
		} else {
			// Open the document
			const uri = vscode.Uri.file(getAbsolutePath(selected.filePath));
			await vscode.window.showTextDocument(uri);
		}
	}
}
