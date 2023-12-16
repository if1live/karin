import { html } from "hono/html";

export const Layout = (props: { children: any }) => html`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="content-language" content="ko-kr" />

      <link rel="icon" href="/static/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="/static/icon.png" />

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.5.0/semantic.min.css"
        integrity="sha512-KXol4x3sVoO+8ZsWPFI/r5KBVB/ssCGB5tsv2nVOKwLg33wTFP3fmnXa47FdSVIshVTgsYk/1734xSk9aFIa4A=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      />

      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js"
        integrity="sha512-3gJwYpMe3QewGELv8k/BX9vcqhryRdzRMxVfq6ngyWXwo03GFEzjsUm8Q7RZcHPHksttq7/GFoxjCVUjkjvPdw=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      ></script>

      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.5.0/semantic.min.js"
        integrity="sha512-Xo0Jh8MsOn72LGV8kU5LsclG7SUzJsWGhXbWcYs2MAmChkQzwiW/yTQwdJ8w6UA9C6EVG18GHb/TrYpYCjyAQw=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      ></script>

      <!-- https://www.srihash.org/: unpkg을 cdnjs 같은 형태로 만들떄 쓴거 -->
      <script
        src="https://unpkg.com/htmx.org@1.9.4"
        integrity="sha384-zUfuhFKKZCbHTY6aRR46gxiqszMk5tcHjsVFxnUo8VMus4kHGVdIYVbOYYNlKmHV"
        crossorigin="anonymous"
      ></script>

      <script
        src="https://unpkg.com/hyperscript.org@0.9.11"
        integrity="sha384-SWTvl6gg9wW7CzNqGD9/s3vxwaaKN2g8/eYyu0yT+rkQ/Rb/6NmjnbTi9lYNrpZ1"
        crossorigin="anonymous"
      ></script>

      <title>karin</title>
    </head>
    <body>
      <header class="ui top small menu">
        <div class="ui container">
          <div class="header item">
            <a href="/">karin</a>
          </div>
          <div class="item">
            <a href="/s/lookup">lookup</a>
          </div>
          <div class="item">
            <a href="/admin">admin</a>
          </div>
        </div>
      </header>

      <section class="ui container">${props.children}</section>
    </body>
  </html>
`;
