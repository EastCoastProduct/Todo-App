var React = require('react');
var UsersList = require('../components/users.js');

if(typeof window !== 'undefined') {
    window.onload = function() {
        React.render(usersView(), document);
    }
}

var users = [ ];

var usersView = React.createClass({
    render: function() {
        return (
            <html>
                <head>
                    <title>Users List</title>
                    <script src="public/bundleUsers.js"></script>
                    <script src="public/bundlecss.js"></script>
                </head>
                <body>
                    <section id="container">
                        <section className="wrapper">
                            <h3><i className="fa"></i>Users</h3>
                            <div className="row mt">
                                <div className="col-md-12">
                                    <section id="todoList" className="task-panel tasks-widget">
                                        <UsersList />
                                    </section>
                                </div>
                            </div>
                        </section>
                    </section>
                </body>
            </html>
        );
    }
});

module.exports = usersView;