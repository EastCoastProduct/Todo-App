import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let ForgotPassword = React.createClass({
	mixins: [Router.Navigation],

	getInitialState(){
		return { email: '', message:'', successMessage: ''}
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
		this.setState({email: e.target.value, emailMessage:'', message:''});
	},

	resetPassword(e){
		e.preventDefault();

		this.handleValidation(res => {
            if(res){
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
				                		userRef.update({ status: "created" })
				                	}
				                }.bind(this))
				            }
				            this.transitionTo('changesuccess', null, { successMessage: 'Password reset email is sent to your email address!' });
				        }.bind(this))
					} else {
						switch (error.code) {
							case "INVALID_USER":
								this.setState({message: "The specified user account does not exist."});
							break;
							default:
							this.setState({message: "Error resetting password."});
						}
					}
				}.bind(this));
			}
		})
	},

	handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;
        if(!emailRegex.test(this.state.email)){
            this.setState({ emailMessage: 'Enter a valid email address.' }); 
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

	render(){
		return <div id='forgotPassword-form'>
				<fieldset>
				<form onSubmit={this.resetPassword} >
					<input type='emailReset' value = { this.state.email } placeholder="Email" onChange = {this.inputEmailTextChange} />
					<div className='errorMessage'>{this.state.emailMessage}</div>
					<input type='submit' value='Reset password'/>
				</form>
				</fieldset>
				<div className='errorMessage paddingLeft'>{this.state.message}</div>
			</div>
	}
});

export default ForgotPassword;