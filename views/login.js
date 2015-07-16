var React = require('react');
var Login = require('../components/login.js');

if(typeof window !== 'undefined') {
    window.onload = function() {
        React.render(loginView(), document);
    }
}

var loginView = React.createClass({
    render: function() {
        return (
            <html>
                <head>
                    <title>To-Do List Login</title>
                    <script src="public/bundleLogin.js"></script>
                    <script src="public/bundlecss.js"></script>
                </head>
                <body>
                    <section id="container">
                        <section className="wrapper">
                            <h3><i className="fa"></i>Login</h3>
                            <div className="row mt">
                                <div className="col-md-6">
                                    <Login />
                                </div>
                            </div>
                        </section>
                    </section>
                </body>
            </html>
        );
    }
});

module.exports = loginView;