import React, { findDOMNode } from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';

let Login = React.createClass({ 
	mixins: [Router.Navigation],

	getInitialState() {
    	return { error: false, message: '', email: '', password: '' };
    },

    componentWillMount() {
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/');
    },

    componentWillUnmount(){
        this.userFb.off();
    },

    handleEmailChange(e) {
        this.setState({ email: e.target.value });
    },

    handlePasswordChange(e) {
        this.setState({ password: e.target.value });
    },

	loginUser(e) {
        e.preventDefault();
        var email = this.state.email;
        var pass = this.state.password;

        if(email.trim().length == 0 || pass.trim().length == 0){
            return this.setState({ error: true, message: "Please enter valid email and password." });
        } else {
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
                                        var userId = auth.getUserId();
                                        this.fb = new Firebase('https://app-todo-list.firebaseio.com/users/' + userId);
                                        this.fb.on("value", function(snap){
                                            var data = snap.val();
                                            if(data.status == "created"){
                                                this.transitionTo('changepassword', null, {id: userId});
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
    },

    render() {
        return (
            <div>
                <form onSubmit={this.loginUser}>
                    <div>
                        <label><input type='text' placeholder="email" onChange={this.handleEmailChange} /></label>
                    </div>
                    <div>
                        <label><input type="password" placeholder="password" onChange={this.handlePasswordChange}/></label>
                    </div>
                    <button type="submit">login</button>
                </form>
                <a href='/#/forgotpassword'>Forgot password?</a>
                <div>{this.state.error ? (this.state.message) : ('')}</div>
            </div>
        );
    }
});

export default Login;  