"use strict";

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

var path = require('path');

var fs = require('fs-extra');

var globby = require('globby');

module.exports = function (options) {
  var _options$raw = options.raw,
      raw = _options$raw === void 0 ? true : _options$raw,
      _options$urlTransform = options.urlTransformer,
      urlTransformer = _options$urlTransform === void 0 ? function (file) {
    return `/${file.replace(/index\.html$/, '')}`;
  } : _options$urlTransform,
      contentTransformer = options.contentTransformer,
      _options$backup = options.backup,
      backup = _options$backup === void 0 ? true : _options$backup,
      globbiest = _objectWithoutProperties(options, ["raw", "urlTransformer", "contentTransformer", "backup"]);

  var cwd = globbiest.cwd;
  return globby('**/*.html', globbiest).then(function (files) {
    var resources = [];

    var _loop = function _loop(x) {
      var file = files[x];
      var html = fs.readFileSync(`${cwd}/${file}`, 'utf-8');
      var regex = /<link.*rel=(?:'|")(preload|prefetch)(?:'|").*>/g;
      var matches = html.match(regex);

      if (!matches) {
        return "continue";
      }

      var headers = [];
      var lines = matches[0].split('<link').filter(function (x) {
        return x;
      });
      lines.forEach(function (line) {
        /*
        * Do we need cheerio?
        * We care about order
        * /rel=(?:'|")(.*)(?:'|")\shref=(?:'|")(.*)(?:'|")\sas=(?:'|")(.*)(?:'|")/
        */
        var _rel = line.match(/rel=(?:'|")(.*?)(?:'|")/);

        var _type = line.match(/as=(?:'|")(.*?)(?:'|")/);

        var _href = line.match(/href=(?:'|")(.*?)(?:'|")/);

        var header;

        if (raw) {
          header = `<${_href[1]}>; rel=${_rel[1]}`;

          if (_type) {
            header += `; as=${_type[1]}`;
          }
        } else {
          header = {
            rel: _rel && _rel[1],
            href: _href && _href[1]
          };

          if (_type) {
            header.type = _type[1];
          }
        }

        headers.push(header);
      });

      if (typeof contentTransformer === 'function') {
        if (typeof backup === 'string') {
          var backupDir = path.basename(backup) ? path.resolve(cwd, backup, file) : path.resolve(backup, file);
          fs.outputFileSync(backupDir, html);
        } else if (backup !== false) {
          // Truthy but not string
          fs.outputFileSync(path.resolve(cwd, '.backup', file), html);
        }

        fs.writeFileSync(path.resolve(cwd, file), contentTransformer({
          html,
          matches
        }));
      }

      resources.push({
        source: urlTransformer(file),
        headers
      });
    };

    for (var x = 0; x < files.length; x++) {
      var _ret = _loop(x);

      if (_ret === "continue") continue;
    }

    return resources;
  });
};