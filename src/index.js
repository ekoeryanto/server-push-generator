const path = require('path')
const fs = require('fs-extra')
const globby = require('globby')

module.exports = options => {
  const {
    raw = true,
    urlTransformer = file => `/${file.replace(/index\.html$/, '')}`,
    contentTransformer,
    backup = true,
    ...globbiest
  } = options

  const {cwd} = globbiest

  return globby('**/*.html', globbiest).then(files => {
    const resources = []

    for (let x = 0; x < files.length; x++) {
      const file = files[x]
      const html = fs.readFileSync(`${cwd}/${file}`, 'utf-8')
      const regex = /<link.*rel=(?:'|")(preload|prefetch)(?:'|").*>/g
      const matches = html.match(regex)

      if (!matches) {
        continue
      }

      const headers = []

      const lines = matches[0].split('<link').filter(x => x)
      lines.forEach(line => {
        /*
        * Do we need cheerio?
        * We care about order
        * /rel=(?:'|")(.*)(?:'|")\shref=(?:'|")(.*)(?:'|")\sas=(?:'|")(.*)(?:'|")/
        */
        const _rel = line.match(/rel=(?:'|")(.*?)(?:'|")/)
        const _type = line.match(/as=(?:'|")(.*?)(?:'|")/)
        const _href = line.match(/href=(?:'|")(.*?)(?:'|")/)

        let header

        if (raw) {
          header = `<${_href[1]}>; rel=${_rel[1]}`
          if (_type) {
            header += `; as=${_type[1]}`
          }
        } else {
          header = {
            rel: _rel && _rel[1],
            href: _href && _href[1]
          }
          if (_type) {
            header.type = _type[1]
          }
        }

        headers.push(header)
      })

      if (typeof contentTransformer === 'function') {
        if (typeof backup === 'string') {
          const backupDir = path.basename(backup) ?
            path.resolve(cwd, backup, file) :
            path.resolve(backup, file)
          fs.outputFileSync(backupDir, html)
        } else if (backup !== false) {
          // Truthy but not string
          fs.outputFileSync(path.resolve(cwd, '.backup', file), html)
        }

        fs.writeFileSync(
          path.resolve(cwd, file),
          contentTransformer({html, matches})
        )
      }

      resources.push({
        source: urlTransformer(file),
        headers
      })
    }

    return resources
  })
}
