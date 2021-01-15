const path = require('path');

module.exports = {
	entry: './src/background/see-on-bgg.js',
	output: {
		filename: 'see-on-bgg.js',
		path: path.resolve(__dirname, 'dist')
	},
	devtool: false
};
