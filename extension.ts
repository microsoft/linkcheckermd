// The some things from 'vscode', which contains the VS Code extensibility API
import {
    window, 
    commands, 
    languages, 
    Diagnostic, 
    DiagnosticSeverity,
    Location,
    Range,
    Position,
    Uri,
    Disposable} from 'vscode';
import validator = require('validator');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(disposables: Disposable[]) { 

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "vscode-linter.linkcheckMD" is now active!'); 
    
    // Create the checker and controller
    let linkChecker = new LinkChecker();
    let controller = new LinkCheckController(linkChecker);
    
	// Dispose of stuff.
    disposables.push(controller);
    disposables.push(linkChecker);
}

// Checks links & displays status (so-far)
class LinkChecker {
    // For writing to the status bar
    private _diagnostics: Diagnostic[];
    private _uri: Uri;
        
    // For disposing
    dispose() {
        this.hideBrokenLinks();
    }
    
    // Show the link count in the status bar
    public showBrokenLinks() {
        //remove previous status bar message
        this.hideBrokenLinks();
        
        // Get the current text editor
        let editor = window.getActiveTextEditor();
        if(!editor) {
            return;
        }
        
        // Geet the document
        let doc = editor.getTextDocument();
        // Set the uri
        this._uri = doc.getUri();
        // Only update the status if a Markdown file
        if(doc.getLanguageId() === "markdown") {
            // Get the document text
            let docContent = doc.getText();
            // Get a count of the lines in thedocument
            let lineCount = doc.getLineCount();
            // Loop through the document, one line at a time
            for(let lineNumber = 1; lineNumber != lineCount; lineNumber++) {
                // Get the text for the current line
                let lineText = doc.getTextOnLine(lineNumber);
                // Are there links?
                let links = lineText.match(/\[[^\[]+\]\([^\)]+\)|\[[a-zA-z0-9_-]+\]:\s*\S+/g);
                if(links) {
                    for(let i = 0; i < links.length; i++) {
                        // Get the URL from each individual link
                        // ([^\)]+) captures inline style link URLs
                        // (\S+) captures reference style link URLs
                        let link = links[i].match(/\[[^\[]+\]\(([^\)]+)\)|\[[a-zA-z0-9_-]+\]:\s*(\S+)/);
                        // Figure out which capture contains the link; inline style or reference
                        let linkToCheck = (link[2] == null) ? link[1] : link[2];
                        // Is the link an HTTP/s URL?
                        if(this.isHttpLink(linkToCheck)) {
                            // Does it reference a specific language in the URL?
                            let lang = this.isLanguageLink(linkToCheck);
                            if(lang) {
                                // Get the location within the document
                                let loc = this.getLocation(link[0], lineText, lineNumber);
                                // Create a diagnostic object
                                let diag = new Diagnostic(DiagnosticSeverity.Warning,
                                    loc, 
                                    `Link contains a language reference: ${lang} `,
                                    "linkcheckMD");
                                // Push it on the array
                                this._diagnostics.push(diag);
                            }
                        }
                    }
                }
            }
            // Add the array of diagnostics
            languages.addDiagnostics(this._diagnostics);
        }
    }
    
    // Generate a location object
    private getLocation(link, lineText, lineNumber): Location {
        let startPos = lineText.indexOf(link);
        let endPos = startPos + link.length -1;
        let start = new Position(lineNumber,startPos);
        let end = new Position(lineNumber, endPos);
        let range = new Range(start, end);
        let loc = new Location(this._uri, range);
        return loc;
    }
    
    public hideBrokenLinks() {
        // Clear the array
        this._diagnostics = new Array<Diagnostic>();
        // And add it
        languages.addDiagnostics(this._diagnostics);
    }
    
    // Is this a valid HTTP/S link?
    private isHttpLink(linkToCheck: string): boolean {
        return validator.isURL(linkToCheck) ? true : false;
    }
    
    // Does the link contain a language specific link?
    private isLanguageLink(linkToCheck) {
        let langMatch = linkToCheck.match(/[a-z]{2}\-[a-z]{2}/);
        return langMatch ? langMatch[0] : null;
    }
    
    private isFourOhFourLink(link) {
        // TODO: make it go
        return false;
    }
}

class LinkCheckController {
    private _linkChecker: LinkChecker;
    private _disposable: Disposable;
    
    constructor(linkChecker: LinkChecker) {
        this._linkChecker = linkChecker;
        this._linkChecker.showBrokenLinks();
        
        // Subscribe to selection changes
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.of(...subscriptions);
    }
    
    dispose() {
        this._disposable.dispose();
    }
    
    private _onEvent() {
        this._linkChecker.showBrokenLinks();
    }
}

