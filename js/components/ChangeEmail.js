import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let ChangeEmail = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { id: this.props.query.id, oldEmail: '', newEmail: '', password: '', message: '' };
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
		this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
    },

    componentWillUnmount() {
    	this.firebaseDb.off();
    	this.userFb.off();
    },

	inputOldEmailTextChange(e){
		this.setState({oldEmail: e.target.value, oldEmailMessage: '', message: '' });
	},

	inputNewEmailTextChange(e){
		this.setState({newEmail: e.target.value, newEmailMessage: '', message: '' });
	},

	inputPasswordTextChange(e){
		this.setState({password: e.target.value, passwordMessage: '', message: '' });
	},

	changeEmail(e){
		e.preventDefault();
		this.handleValidation(res => {
			if(res){
				this.userFb.once("value", function(snap){
					var userData = snap.val();
					if(userData.email != this.state.oldEmail){
						this.setState({message: "The specified email address is incorrect."});
					} else {
						this.firebaseDb.changeEmail({
							oldEmail: this.state.oldEmail,
							newEmail: this.state.newEmail,
							password: this.state.password
						}, function(error){
							if(error) {
								switch (error.code) {
									case "INVALID_PASSWORD":
										this.setState({error: true, message: "The specified user account password is incorrect."});
									break;
									case "INVALID_USER":
										this.setState({error: true, message: "The specified user account does not exist."});
									break;
									default:
									this.setState({error: true, message: "Error creating user"});
								}
							} else {
								this.userFb.update({ email: this.state.newEmail	})
								this.transitionTo('changesuccess', null, { successMessage: 'Your email address is successfuly changed!' });
							}
						}.bind(this))
					}
				}.bind(this))
			}
		})
	},

	cancel(){
		this.transitionTo('myaccount');
	},

	handleValidation(response){
		response = arguments[arguments.length - 1];
		var err = false;
		var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;
		if(!emailRegex.test(this.state.oldEmail)){
			this.setState({ oldEmailMessage: 'Enter a valid email address.' }); 
			err = true;
		}
		if(!emailRegex.test(this.state.newEmail)){
			this.setState({ newEmailMessage: 'Enter a valid email address.' }); 
			err = true;
		}
		if(this.state.password.trim().length == 0){
			this.setState({ passwordMessage: 'Enter password.' });
			err = true;
		}
		if(err){ response (false); return; } else { response (true); return; }
	},

	render(){
		return <div id='changeData-form'>
				<fieldset>
					<form onSubmit={this.changeEmail} >
							<input type='email' placeholder="Old Email" value={this.state.oldEmail} onChange = {this.inputOldEmailTextChange} />
							<div className='errorMessage'>{this.state.oldEmailMessage}</div>

							<input type='email' placeholder="New Email" value={this.state.newEmail} onChange = {this.inputNewEmailTextChange} />
							<div className='errorMessage'>{this.state.newEmailMessage}</div>

							<input type='password' placeholder="Password" value={this.state.password} onChange = {this.inputPasswordTextChange} />
							<div className='errorMessage'>{this.state.passwordMessage}</div>
							<input type='submit' value='Save'/>
					</form>
				</fieldset>
				<div className='errorMessage paddingLeft'>{this.state.message}</div>
			</div>
	}
});

export default ChangeEmail;