module.exports = {
  entry: './js/app.js',
  output: {
    filename: 'bundle.js'       
  },
  module: {
        loaders: [
            { test: /\.js?$/, loaders: ['react-hot', 'babel'], exclude: /node_modules/ },
            { test: /\.css$/, loader: "style!css" }
        ]
    }
};