import React, { findDOMNode } from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';

let Login = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
    	return { error: false, message: '', email: '', password: '', passwordResetMessage: this.props.query.successMessage };
    },

    componentWillMount() {
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/');

        var currentRoutes = this.context.router.getCurrentRoutes();
        var lastRoute = currentRoutes[currentRoutes.length - 1];
        if(lastRoute.name == "login"){
            var element = document.body;
            element.className="login";
        }
    },

    componentWillUnmount(){
        this.userFb.off();
    },

    handleEmailChange(e) {
        this.setState({ email: e.target.value, emailMessage:'', message:'' });
    },

    handlePasswordChange(e) {
        this.setState({ password: e.target.value, passwordMessage:'', message:'' });
    },

	loginUser(e) {
        e.preventDefault();
        var email = this.state.email;
        var pass = this.state.password;

        this.handleValidation(res => {
            if(res){
                this.userFb.orderByChild('email').startAt(email).endAt(email).once('value', function(snapshot){
                    var users = snapshot.val();
                    if(users == null) {
                        return this.setState({ error: true, message: "The specified email is invalid."  });
                    } else {
                        for (var k in users) {
                            var userRef = new Firebase(this.userFb + "/" + k);
                            userRef.once("value", function(snap) {
                                var data = snap.val();
                                var status = data.status;
                                if(status == "inactive"){
                                    return this.setState({ error: true, message: 'Your account is deactivated, please contact administrator.' });
                                } else {
                                    auth.login(email, pass, (loggedIn) => {
                                        if (!loggedIn) {
                                            var err = auth.getLoginError();
                                            return this.setState({ error: true, message: err });
                                        } else {
                                            var userId = k;
                                            localStorage.userId = k;
                                            this.fb = new Firebase('https://app-todo-list.firebaseio.com/users/' + userId);
                                            this.fb.on("value", function(snap){
                                                var data = snap.val();
                                                if(data.status == "created"){
                                                    this.transitionTo('edituser', null, {id: userId});
                                                } else {
                                                    this.transitionTo('moduleslist');
                                                }
                                            }.bind(this))
                                        }
                                    });
                                }
                            }.bind(this))
                        }
                    }
                }.bind(this))
            }
        })
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var emailRegex = /^[0-9a-zA-Z]+([0-9a-zA-Z]*[-._+])*[0-9a-zA-Z]+@[0-9a-zA-Z]+([-.][0-9a-zA-Z]+)*([0-9a-zA-Z]*[.])[a-zA-Z]{2,6}$/;
        if(!emailRegex.test(this.state.email)){
            this.setState({ emailMessage: 'Enter a valid email address.' });
            err = true;
        }
        if(this.state.password.trim().length == 0){
            this.setState({ passwordMessage: 'Enter password.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

    render() {
        return (
                <div id="changeData-form" className='paddingBottom'>
					<img src="https://resilientcoders.s3.amazonaws.com/i/white-skull.png" />
                    <fieldset>
                        <form onSubmit={this.loginUser}>
                            {this.state.passwordResetMessage ? (<div className='errorMessage'>{this.state.passwordResetMessage}</div>) : (<div></div>)}
                            <input type='email' placeholder="Email" onChange={this.handleEmailChange} />
                            <input type="password" placeholder="Password" onChange={this.handlePasswordChange}/>
							<input type="submit" value="Login" />
							<div className='errorMessage'>{this.state.emailMessage}</div>
                            <div className='errorMessage'>{this.state.passwordMessage}</div>
                            <footer className="clearfix">
                                <p><a href='/#/forgotpassword'>Forgot Password</a></p>
                            </footer>
                        </form>
                        <div className='errorMessage paddingTop'>{this.state.message}</div>
                    </fieldset>
                </div>
        );
    }
});

export default Login;