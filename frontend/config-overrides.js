const webpack = require("webpack")

module.exports = function override(config) {

config.resolve.fallback = {
fs: false,
crypto: false,
stream: false
}

return config

}