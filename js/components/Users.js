import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';

let UsersList = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return { users: [] };
    },

    componentWillMount() {
        this.firebaseDb = new Firebase("https://app-todo-list.firebaseio.com/users/");
        this.currentUser = auth.getUserId();
        this.getAllUsers();
    },

    getAllUsers() {
        this.firebaseDb.on("child_added", function(data){
            var array = this.state.users;
            var items = data.val();
            if(!auth.isAdmin()){
                if(!items.isAdmin){
                    items.id = data.key();
                    if (data.key() != this.currentUser){
                        this.userDb = new Firebase(this.firebaseDb + '/' + data.key());
                        this.userDb.once("value", function(snap){
                            array.push(items);
                            this.setState({ users: array });
                        }.bind(this));
                    }
                }
            } else {
                items.id = data.key();
                if (data.key() != this.currentUser){
                    this.userDb = new Firebase(this.firebaseDb + '/' + data.key());
                    this.userDb.once("value", function(snap){
                        array.push(items);
                        this.setState({ users: array });
                    }.bind(this));
                }
            }
        }.bind(this));
    },

    componentWillUnmount() {
        this.firebaseDb.off();
    },

    redirectToNewUser() {
        this.transitionTo('newuser');
    },

    render() {
        var users = this.state.users;
        var _singleItems = [];

        users.forEach(function (user, i) {
            _singleItems.push(<UserItem key={i} user={users[i]} />);
        });

        return <div>
                {_singleItems != '' ? (<div>{ _singleItems } </div> ) : (<div>No users</div> )} 
                {(auth.loggedIn() && auth.isAdmin())? (<div><button type='button' onClick={this.redirectToNewUser}>Add new user</button></div>) : (<div></div>)}
               </div>;
    }
});

let UserItem = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return { value: this.props.user.first_name }
    },

    remove() {
        //firebaseDb.destroy(this.props.user.id); //also add remove user functionality
    },

    edit() {
        this.transitionTo('edituser', null, { id: this.props.user.id });
    },

    viewProfile() {
        this.transitionTo('userinfo', null, { id: this.props.user.id });
    },

    render() {
        var user = this.props.user;

        return <ul>
                <li key={ user.id }>
                    <span>
                        <span>{this.state.value}</span>
                        <div><button type='button' onClick={this.viewProfile}><i> View profile </i></button></div>
                        {(auth.loggedIn() && auth.isAdmin()) ? (
                            <div><button type='button'><i> delete </i></button></div>) : (<div></div>)}
                    </span>
                </li>
               </ul>;
    }
});

module.exports = UsersList;