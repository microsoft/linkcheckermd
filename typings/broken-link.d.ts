
interface IBrokenLinkOptions {
  uri?: string
  allowRedirects?: boolean
  allow404Pages?: boolean
  allowSoft404?: boolean
  ignoreErrors?: number[]
  ignoreStatusCodes?: number[]
  match404Page?: string
}

declare module "broken-link" {
  function brokenLink(url: string, options?: IBrokenLinkOptions): Promise<boolean>;
  export = brokenLink;
}