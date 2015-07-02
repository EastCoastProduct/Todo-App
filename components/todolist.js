/** @jsx React.DOM */
var React = require('react');
var Firebase = require('firebase');

var TodoList = React.createClass({
    getInitialState: function() {
    this.items = [];
    return {items: [], text: ""};
},

componentWillMount: function() {
    this.firebaseDb = new Firebase("https://app-todo-list.firebaseio.com/");
    this.firebaseDb.on("child_added", function(data) {
        this.items.push(data.val());
        this.setState({
            items: this.items
        });
    }.bind(this));
},

componentWillUnmount: function() {
    this.firebaseDb.off();
},

inputTextChange: function(e) {
    this.setState({text: e.target.value}); //set new state immediately
},

addNewItem: function(e) {
    e.preventDefault(); //prevent page reload
    if (this.state.text.trim().length !== 0) {
        this.firebaseDb.push({
            text: this.state.text
        });
        this.setState({text: ""}); //clear input
    }},

deleteItem: function(){
    console.log("delete");
    this.firebaseDb.remove();
},

editItem: function(){
    console.log("edit");
},

completeItem: function(){
    console.log("complete");
},

render: function() {
    return <div className='panel-body'>
                <div className='task-content'>
                    <SingleItem items= { this.state.items } onDelete={this.deleteItem} onEdit={this.editItem} onComplete={this.completeItem}/>
                </div>
                <form onSubmit={this.addNewItem } >
                    <div className='col-sm-5 nopaddingLeft'>
                        <input type="text" className='form-control' onChange= { this.inputTextChange } value= { this.state.text } />
                    </div>
                    <AddNewTaskButton />
                </form>
            </div>;
    }
});

var SingleItem = React.createClass({
    handleDelete: function(){
    this.props.onDelete(this);
},

handleEdit: function(){
    this.props.onEdit(this);
},

handleComplete: function(){
    this.props.onComplete(this);
},

render: function() {
    return <ul className='task-list'>
                {this.props.items.map(function(item, index){
                    return <li key={index} className=''>
                                <div className='task-checkbox'>
                                    <input type='checkbox' className='list-child' value='' />
                                </div>
                                <div className='task-title'>
                                    <span className='task-title-sp'>{item.text}</span>
                                    <div className='pull-right'>
                                        <button type='button' onClick={this.handleComplete} className='btn btn-success btn-xs'>
                                            <i className='fa'> completed </i>
                                        </button>
                                        <button type='button' onClick={this.handleEdit} className='btn btn-primary btn-xs'>
                                            <i className='fa'> edit </i>
                                        </button>
                                        <button type='button' onClick={this.handleDelete} className='btn btn-danger btn-xs' >
                                            <i className='fa'> delete </i>
                                        </button>
                                    </div>
                                </div>
                            </li>
                    }.bind(this))}
            </ul>;
    }
});

var AddNewTaskButton = React.createClass({
    render: function(){
        return <div className='add-task-row'>
                    <button className='btn btn-success btn-sm pull-left'> Add new task </button>
                </div>
    }
});

module.exports = TodoList;