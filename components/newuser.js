/** @jsx React.DOM */
var React = require('react');
var Firebase = require('firebase');

var NewUser = React.createClass({
	getInitialState: function() {
		this.user = {};
	  	return { uid: '', first_name: '', last_name: '', email: '', isAdmin: false, user: {}};
	},

	componentWillMount: function() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/users/');
	},

	inputEmailTextChange: function(e) {
    	this.setState({email: e.target.value});
	},

	inputPasswordTextChange: function(e) {
    	this.setState({password: e.target.value});
	},

	inputFirstNameTextChange: function(e) {
    	this.setState({first_name: e.target.value});
	},

	inputLastNameTextChange: function(e) {
    	this.setState({last_name: e.target.value});
	},

	createUser: function(e) {
		e.preventDefault();
		if (this.state.email.trim().length !== 0) {
				this.firebaseDb.createUser({ 
		  		email: this.state.email,
				password: this.state.password
			}, function(error, userData) {
				if (error) {
					console.log("Error creating user:", error);
				} else {
					console.log("Successfully created user account with uid:", userData.uid);
					this.setState({uid: userData.uid})
					this.firebaseDb.push({
						uid: this.state.uid,
					    first_name: this.state.first_name,
					    last_name: this.state.last_name,
					    email: this.state.email,
					    isAdmin: false
					});
					this.setState({email: ""}); 
					this.setState({password: ""});
				}
			}.bind(this));
		};
	},

	render: function() {
		return <div>
					<form onSubmit={this.createUser} >
						<div><span className="col-md-2">First name:</span>
				           <input type = 'text' value = { this.state.first_name } onChange = {this.inputFirstNameTextChange} />
				       </div>
				       <div><span className="col-md-2">Last name:</span>
				           <input type = 'text' value = { this.state.last_name } onChange = {this.inputLastNameTextChange} />
				       </div>
						<div><span className="col-md-2">E-mail:</span>
				            <input type = 'text' value = { this.state.email } onChange = {this.inputEmailTextChange} />
				        </div>
				        <div><span className="col-md-2">Password:</span>
				            <input type = 'text' value = { this.state.password } onChange = {this.inputPasswordTextChange} />
				        </div>
	                    <div className="col-md-4"><span className="pull-right"><button> Add new user </button></span></div>
					</form>
				</div>;
	}
});

module.exports = NewUser;