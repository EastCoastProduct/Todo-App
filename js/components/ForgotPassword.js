import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//validation

let ForgotPassword = React.createClass({
	mixins: [Router.Navigation],

	getInitialState(){
		return { email: ''}
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
		this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/');
    },

    componentWillUnmount() {
    	this.firebaseDb.off();
    	this.userFb.off();
    },

    inputEmailTextChange(e){
		this.setState({email: e.target.value});
	},

	resetPassword(e){
		e.preventDefault();

		if (this.state.email.trim().length !== 0) {
			this.firebaseDb.resetPassword({
				email: this.state.email
			}, function(error) {
				if (error === null) {
					this.userFb.orderByChild('email').startAt(this.state.email).endAt(this.state.email).once('value', function(snapshot){
			            var users = snapshot.val();
			            for (var k in users) {
			                var userRef = new Firebase(this.userFb + "/" + k);
			                userRef.once("value", function(snap){
			                	var data = snap.val();
			                	if(data.status != "inactive"){
			                		userRef.update({
					                	status: "created"
					                })
			                	}
			                }.bind(this))
			            }
			            this.transitionTo('login');
			        }.bind(this))
				} else {
					switch (error.code) {
						case "INVALID_USER":
							console.log("The specified user account does not exist.");
						break;
						default:
						console.log("Error resetting password:", error);
					}
				}
			}.bind(this));
		}
	},

	cancel(){
		this.transitionTo('login');
	},

	render(){
		return <div>
				<form onSubmit={this.resetPassword} >
					<div><span>E-mail:</span>
						<input type = 'text' value = { this.state.email } onChange = {this.inputEmailTextChange} />
					</div>
					<div><span><button>Reset password</button></span></div>
				</form>
				<div><span><button onClick = {this.cancel}>Cancel</button></span></div>
			</div>
	}
});

module.exports = ForgotPassword;