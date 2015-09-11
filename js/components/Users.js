import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
var Link = Router.Link;
import auth from '../auth';

//add created users, active users and deleted(inactive) users for admin

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
                    if (data.key() != this.currentUser && items.status != "inactive"){
                        this.userDb = new Firebase(this.firebaseDb + '/' + data.key());
                        this.userDb.once("value", function(snap){
                            array.push(items);
                            this.setState({ users: array });
                        }.bind(this));
                    }
                }
            } else {
                items.id = data.key();
                if ((data.key() != this.currentUser) && items.status != "inactive"){
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
                {_singleItems != '' ? (<div>{ _singleItems } </div> ) : (<div></div> )}
                {(auth.loggedIn() && auth.isAdmin())? (<div className='paddingTopBig'><button className="button_example" type='button' onClick={this.redirectToNewUser}>Add new user</button></div>) : (<div></div>)}
               </div>;
    }
});

let UserItem = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return { firstName: this.props.user.first_name, email: this.props.user.email }
    },

    render() {
        var user = this.props.user;
        return <Link to="userinfo" params={{ id: this.props.user.id }}><div className='userItem marginTop paddingBottomSmall itemBackground overflow' key={ user.id }><div className='moduleKey'>{this.state.firstName}</div></div></Link>;
    }
});

export default UsersList;
