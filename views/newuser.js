var React = require('react');
var NewUser = require('../components/newuser.js');

if(typeof window !== 'undefined') {
    window.onload = function() {
        React.render(newUserView(), document);
    }
}

var newUserView = React.createClass({
    render: function() {
        return (
            <html>
                <head>
                    <title>To-Do List New User</title>
                    <script src="public/bundlenewuser.js"></script>
                    <script src="public/bundlecss.js"></script>
                </head>
                <body>
                    <section id="container">
                        <section className="wrapper">
                            <h3><i className="fa"></i>Create new user</h3>
                            <div className="row mt">
                                <div className="col-md-6">
                                    <NewUser />
                                </div>
                            </div>
                        </section>
                    </section>
                </body>
            </html>
        );
    }
});

module.exports = newUserView;