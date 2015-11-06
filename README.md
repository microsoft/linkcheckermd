This extension demonstrates how to perform checks against links in a Markdown document during editing. Specifically, this extension:

1. Extracts all links from the document (both inline and reference links, but not HTML links,) using a regular expression
2. Checks the HTTP/S URLs to see if they reference a language specific version of a URL by checking for a pattern of "LC-CC", where LC is a language code and CC is a country code. For example, "en-us". Ideally want to point to a generic URL that will route viewers to language specific pages based on the browser language setting. So these links are reported as errors.

TODO

* Check for broken links: This took too long to check for every change to the document, so it's now tied to Alt+L. But the code isn't active yet, as I'm waiting on examples/guidance on using outputChannels or some other reporting mechanism.

