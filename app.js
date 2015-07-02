var React = require('react');
var TodoList = require('./components/todolist.js');

if(typeof window !== 'undefined') {
    window.onload = function() {
        React.render(mainView(), document);
    }
}

var items = [ ];

var mainView = React.createClass({
    render: function() {
        return (
            <html>
                <head>
                    <title>To-Do List</title>
                    <script src="public/bundle.js"></script>
                    <script src="public/bundlecss.js"></script>
                </head>
                <body>
                    <section id="container">
                        <section className="wrapper">
                            <h3><i className="fa"></i>To-Do List</h3>
                            <div className="row mt">
                                <div className="col-md-12">
                                    <section id="todoList" className="task-panel tasks-widget">
                                        <TodoList />
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

module.exports = mainView;