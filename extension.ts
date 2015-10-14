// The some things from 'vscode', which contains the VS Code extensibility API
import {window, commands, Disposable} from 'vscode';
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
    private _statusBarMessage: Disposable;
    
    // For disposing
    dispose() {
        this.hideBrokenLinkCount();
    }
    
    // Show the link count in the status bar
    public showBrokenLinkCount() {
        //remove previous status bar message
        this.hideBrokenLinkCount();
        
        // Get the current text editor
        let editor = window.getActiveTextEditor();
        if(!editor) {
            return;
        }
        // Geet the document
        let doc = editor.getTextDocument();
        
        // Only update the status if a Markdown file
        if(doc.getLanguageId() === "markdown") {
            // get the document text
            let docContent = doc.getText();
            
            // Regex to find Markdown links
            // FYI, captures for the link text and actuall link would be (/\[([^\[]+)\]\(([^\)]+)\)/);
            let links = docContent.match(/\[[^\[]+\]\([^\)]+\)|\[[a-zA-z0-9_-]+\]:\s*\S+/g);
            
            // If there are actual links in the document
            if(links != null) {
                // Get a count of links
                let linkCount = links.length;
                // Set the base message
                //this._statusBarMessage = window.setStatusBarMessage(linkCount !== 1 ? `${linkCount} Links` : '1 link');
                
                // Retrieve only the links matching HTTP(S) URLs
                let httpLinks = this.getHttpLinks(links);
                this._statusBarMessage = window.setStatusBarMessage(`${linkCount} Links and ${httpLinks.length} HTTP(S) Links`);
                // Create some counters
                let languageLinkCount=0;
                let fourOhFourLinkCount=0;
                // Loop through each link
                for(let i = 0; i < httpLinks.length; i++) {
                    // Is it a link with a language (en-us) in the URL?
                    if(this.isLanguageLink(httpLinks[i])) {
                        languageLinkCount++;
                    }
                    // Does it return a 404?
                    if(this.isFourOhFourLink(httpLinks[i])) {
                        fourOhFourLinkCount++;
                    }
                }
            }
        }
    }
    
    public hideBrokenLinkCount() {
        if(this._statusBarMessage) {
            this._statusBarMessage.dispose();
        }
    }
    
    public getHttpLinks(links: RegExpMatchArray) {
        let httpLinks=[];
        for(let i = 0; i < links.length; i++) {
            let uri = links[i].match(/\[([^\[]+)\]\(([^\)]+)\)/);
            console.log(uri);
            if(validator.isURL(links[i])) {
                httpLinks.push(links[i]);
            }
        }
        return httpLinks;
    }
    
    public isLanguageLink(link) {
        // TODO: make it go
        return false;
    }
    
    public isFourOhFourLink(link) {
        // TODO: make it go
        return false;
    }
}

class LinkCheckController {
    private _linkChecker: LinkChecker;
    private _disposable: Disposable;
    
    constructor(linkChecker: LinkChecker) {
        this._linkChecker = linkChecker;
        this._linkChecker.showBrokenLinkCount();
        
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
        this._linkChecker.showBrokenLinkCount();
    }
}

