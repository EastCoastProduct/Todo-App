/** @jsx React.DOM */
var React = require('react');
var Firebase = require('firebase');

var Login = React.createClass({

	getInitialState: function() {
	  return {
	    loggedClass: false,
	    user: {}
	  };
	},

	componentWillMount: function() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/users/');
	},

	componentDidMount: function() {
		this.firebaseDb.onAuth(function globalOnAuth(authData) {
			if(authData){
				this.setState({loggedClass: true});
				console.log(this.state.loggedClass + " true"); //todo: remove
			} else {
				this.setState({loggedClass: false});
				console.log(this.state.loggedClass + " false"); //todo: remove
			}
		}.bind(this));
	},

	componentWillUnmount: function() {
		this.firebaseDb.off();
	},

	inputEmailTextChange: function(e) {
    	this.setState({email: e.target.value}); //set new state immediately
	},

	inputPasswordTextChange: function(e) {
    	this.setState({password: e.target.value}); //set new state immediately
	},

	loginUser: function(e) {
		e.preventDefault();
		if (this.state.email.trim().length !== 0 && this.state.password.trim().length !== 0) {
				this.firebaseDb.authWithPassword({ 
		  		email: this.state.email,
				password: this.state.password
			}, function(error, authData) {
				if (error) {
					console.log("Login failed!", error);
				} else {
					console.log("Authenticated successfully with payload:", authData);
				}
			});
		}
		this.setState({email: ""}); 
		this.setState({password: ""}); 
	},

	logoutUser: function() {
		this.firebaseDb.unauth();
	},

	render: function() {
		var logoutButton;
		if(this.state.loggedClass) {
			logoutButton = <Logout onLogout = {this.logoutUser} />;
		} /*else {
			loginButton = <loginButton />;
		}*/

		return <div>
				  <form onSubmit={this.loginUser} >
			   	      <div><span className="col-md-2">E-mail:</span>
			              <input type = 'text' value = { this.state.email } onChange = {this.inputEmailTextChange} />
			          </div>
			          <div><span className="col-md-2">Password:</span>
			              <input type = 'text' value = { this.state.password } onChange = {this.inputPasswordTextChange} />
			          </div>
                      <div className="col-md-4"><span className="pull-right"><button> Login </button></span></div>
				  </form>
				  {logoutButton}
			   </div>;
	}
});

var Logout = React.createClass({
	handleLogout: function() {
		this.props.onLogout(this);
	},

	render: function() {
		return <div>
				<form onSubmit={this.handleLogout}>
			   	   <div className="col-md-2"><span className="pull-right"><button> Logout </button></span></div>
			   	</form>
			   </div>;
	}
});

module.exports = Login;