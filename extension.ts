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
    Disposable,
    TextDocument} from 'vscode';
// For HTTP/s address validation
import validator = require('validator');
// For checking broken links
import brokenLink = require('broken-link');

//Interface for links
interface Link {
    text: string
    address: string
    lineNumber: number
    lineText: string
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(disposables: Disposable[]) { 
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
    private _currentDiagnostics: Disposable;
    private _uri: Uri;
        
    // For disposing
    dispose() {
        this.disposeCurrentDiagnostics;
    }
    
    // Dispose of current diagnostics
    private disposeCurrentDiagnostics() { 
         if(this._currentDiagnostics) {
             this._currentDiagnostics.dispose();
         }
     }
     
    // Show the link count in the status bar
    public diagnoseLinks() {
        // Get the current text editor
        let editor = window.getActiveTextEditor();
        // If it's not an editor, return
        if(!editor) {
            return;
        }
        try {
            // Get the document
            let doc = editor.getTextDocument();
            // Get the document uri
            this._uri = doc.getUri();
            
            // Only update the status if a Markdown file
            if(doc.getLanguageId() === "markdown") {
                //Get a promise for an array of markdown links in the document, then...
                getLinks(doc).then((links) => {
                    // Iterate over the array, generating an array of promises
                    let countryCodePromise = Promise.all<Diagnostic>(links.map((link): Diagnostic => {
                        // For each link, check the country code...
                        return isCountryCodeLink(link, this._uri);
                        // Then, when they are all done..
                    }));
                    
                    // Find the links that are only HTTP/s URIs
                    let httpLinks = links.filter(value => isHttpLink(value.address));
                    // Iterate over the array of HTTP/s linnks and get an array of promises
                    let brokenLinkPromise = Promise.all<Diagnostic>(httpLinks.map((link): Promise<Diagnostic> => {
                        let countryCodeDiag = isCountryCodeLink(link, this._uri);
                        // For each link, generate a promise to return a diagnostic
                        if(isHttpLink)
                            return getBrokenLinkPromise(link, this._uri);
                        // Then, when all the promises have completed
                    }));
                    
                    // Finally, let's complete the promise for country code...
                    countryCodePromise.then((countryCodeDiag) => {
                        // And broken links...
                        brokenLinkPromise.then((brokenLinkDiag) => {
                            // And le's combine the array of diagnostics
                            let allDiag = countryCodeDiag.concat(brokenLinkDiag);
                            // Then filter out null ones
                            let filteredDiag = allDiag.filter(diagnostic => diagnostic != null);
                            // Then dispose of current diags
                            this.disposeCurrentDiagnostics;
                            // Then add the new ones
                            this._currentDiagnostics = languages.addDiagnostics(filteredDiag);
                        })
                    })
                }).catch(); // do nothing; no links were found
            }
        } catch(err) {
            let message: string=null;
            if(typeof err.message==='string' || err.message instanceof String) {
                message = <string>err.message;
                message = message.replace(/\r?\n/g, ' ');
                throw new Error(message);
            }
            throw err;
        }
    }
}

// Get promise for broken links
function getBrokenLinkPromise(link: Link, documentUri: Uri): Promise<Diagnostic> {
    return new Promise<Diagnostic>((resolve, reject) => {
        // Promise to check the link
        brokenLink(link.address, {allow404Pages: true}).then((answer) => {
            let brokenLinkDiag: Diagnostic = null;
            // If it is broken, create and return a promise
            if(answer) {
                brokenLinkDiag = createDiagnostic(
                    DiagnosticSeverity.Error,
                    link.text,
                    link.lineText,
                    link.lineNumber,
                    documentUri,
                    "Link is unreachable"
                );
            }
            // Resolve the promise by returning the diagnostic
            resolve(brokenLinkDiag);
        });
    });
}
                        
// Parse the MD style links out of the document
function getLinks(document: TextDocument): Promise<Link[]> {
    // Return a promise, since this might take a while for large documents
    return new Promise<Link[]>((resolve, reject) => {
        // Create arrays to hold links as we parse them out
        let linksToReturn = new Array<Link>();
        // Get lines in the document
        let lineCount = document.getLineCount();
        
        //Loop over the lines in a document
        for(let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
            // Get the text for the current line
            let lineText = document.getTextOnLine(lineNumber);
            // Are there links?
            let links = lineText.match(/\[[^\[]+\]\([^\)]+\)|\[[a-zA-z0-9_-]+\]:\s*\S+/g);
            if(links) {
                // Iterate over the links found on this line
                for(let i = 0; i< links.length; i++) {
                    // Get the URL from each individual link
                    // ([^\)]+) captures inline style link address
                    // (\S+) captures reference style link address
                    var link = links[i].match(/\[[^\[]+\]\(([^\)]+)\)|\[[a-zA-z0-9_-]+\]:\s*(\S+)/);
                    // Figure out which capture contains the address; inline style or reference
                    let address = (link[2] == null) ? link[1] : link[2];
                    //Push it to the array
                    linksToReturn.push({
                        text: link[0],
                        address: address,
                        lineNumber: lineNumber,
                        lineText: lineText
                    });
                }
            }
        }
        if(linksToReturn.length > 0) {
            //Return the populated array, which completes the promise.
            resolve(linksToReturn);
        } else {
            //Reject, because we found no links
            reject;
        }
    });
}

// Check for addresses that contain country codes
function isCountryCodeLink(link: Link, documentUri: Uri): Diagnostic {
    let countryCodeDiag=null;
    //Regex for country-code
    let hasCountryCode = link.address.match(/\/[a-z]{2}\-[a-z]{2}\//);
    //If one was found...
    if(hasCountryCode) {
        //Create the diagnostics object
        countryCodeDiag = createDiagnostic(
            DiagnosticSeverity.Warning,
            link.text,
            link.lineText,
            link.lineNumber,
            documentUri,
            `Link contains a language reference: ${hasCountryCode[0]} `
        );
    }
    return countryCodeDiag;
}

// Is this a valid HTTP/S link?
function isHttpLink(linkToCheck: string): boolean {
    // Use the validator to avoid writing URL checking logic
    return validator.isURL(linkToCheck, {require_protocol: true}) ? true : false;
}

// Generate a diagnostic object
function createDiagnostic(severity: DiagnosticSeverity, markdownLink, lineText, lineNumber, uri, message): Diagnostic {
    // Get the location of the text in the document
    // based on position within the line of text it occurs in
    let startPos = lineText.indexOf(markdownLink);
    let endPos = startPos + markdownLink.length -1;
    let start = new Position(lineNumber,startPos);
    let end = new Position(lineNumber, endPos);
    let range = new Range(start, end);
    let loc = new Location(uri, range);
    // Create the diagnostic object
    let diag = new Diagnostic(severity, loc, message);
    // Return the diagnostic
    return diag;
}

class LinkCheckController {
    private _linkChecker: LinkChecker;
    private _disposable: Disposable;
    
    constructor(linkChecker: LinkChecker) {
        this._linkChecker = linkChecker;
        this._linkChecker.diagnoseLinks();
        
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
        this._linkChecker.diagnoseLinks();
    }
}

