This extension demonstrates how to perform checks against links in a Markdown document during editing. Specifically, this extension:

1. Extracts all Markdown links from the document (both inline and reference links, but not raw HTML links,) using a regular expression.
2. Checks the HTTP/S URLs to see if they reference a language specific version of a URL by checking for a pattern of "LC-CC", where LC is a language code and CC is a country code. For example, "en-us". Ideally want to point to a generic URL that will route viewers to language specific pages based on the browser language setting. So these links are reported as errors.
3. Binds Alt-L to check for broken links. This tries to reach each link, and can take some time, so it opens an output panel to the left of the document and shows the status of the links as it checks them.

    NOTE: Checking for broken links is more of an art than a science. Some sites don't actually return 404, but send you to a landing page. For example, Azure.com works this way. You can go to https://Azure.com/foo/bar and it will happily redirect you to https://Azure.com, with no 404 status returned. So take a status of "OK" with a grain of salt - you may not be arriving at the page you intend.

TODO:

* Refactor broken link checking to display the actual URL that you arrived at for "OK" results.

