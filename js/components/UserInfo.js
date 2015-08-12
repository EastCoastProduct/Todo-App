import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//add image

let UserInfo = React.createClass({
	mixins: [Router.Navigation],
    
	getInitialState() {
		return { id: this.props.query.id };
	},

	componentWillMount() {
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
        this.getUserData();
        /*if(!auth.isAdmin()) {
            this.getModuleDataForStudent();
        }*/
    },

    componentWillUnmount() {
        this.userFb.off();
    },

    getUserData() {
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email
            });
        }.bind(this));
    },

    showAllUsers() {
        this.transitionTo('users');
    },

	render() {
		return <div>
					<div><span>First name:</span>
                        <div>{ this.state.firstName }</div>
			        </div>
			        <div><span>Last name:</span>
                        <div>{ this.state.lastName }</div>
			        </div>
					<div><span>E-mail address:</span>
                        <div>{ this.state.email }</div>
			        </div>
                    <div><span><button onClick={this.showAllUsers}>Show all users</button></span></div>
				</div>;
	}
});

module.exports = UserInfo;