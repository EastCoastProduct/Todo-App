import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';

//remove current user from list of users
//add link in header for preview and edit account

let UsersList = React.createClass({
    mixins: [Router.Navigation], //mixin for redirect on button click, transitionTo function

    getInitialState() {
        return { users: [] };
    },

    componentWillMount() {
        this.firebaseDb = new Firebase("https://app-todo-list.firebaseio.com/users/");
        this.getAllUsers();
    },

    getAllUsers() {
      this.firebaseDb.on("child_added", function(data){
        var array = this.state.users;
        var items = data.val();
        if(!auth.isAdmin()){
          if(!items.isAdmin){
            items.id = data.key();
            this.userDb = new Firebase(this.firebaseDb + '/' + data.key());
            this.userDb.once("value", function(snap){
              array.push(items);
              this.setState({ users: array });
            }.bind(this));
          }} else {
            items.id = data.key();
            this.userDb = new Firebase(this.firebaseDb + '/' + data.key());
            this.userDb.once("value", function(snap){
              array.push(items);
              this.setState({ users: array });
            }.bind(this));
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
      
      return <div className='panel-body'>
                 <div className='task-content'>
                  { _singleItems } 
                 </div>  
                 {(auth.loggedIn() && auth.isAdmin())? (
                    <div>
                  <button type='button' onClick={this.redirectToNewUser} className='btn btn-success btn-sm pull-left'>Add new user</button>
                 </div>
                  ) : (<div></div>)}
                 
             </div>;
    }
});

let UserItem = React.createClass({
    mixins: [Router.Navigation],
    
    getInitialState() {
        return {
            value: this.props.user.first_name
        }
    },

    remove() {
        //firebaseDb.destroy(this.props.user.id); //also add remove user functionality
    },

    edit() {
        //todo: onclick redirect to edit user
    },

    viewProfile() {
        this.transitionTo('userinfo', null, { id: this.props.user.id });
    },

    render() {
      var user = this.props.user;
    
      return <ul className='task-list'>
                  <li key={ user.id } className=''>
                        <span className='task-title'>
                            <span className='task-title-sp'>{this.state.value}</span>
                            <div>
                                <button type='button' onClick={this.viewProfile}>
                                    <i> View profile </i>
                                </button>
                            </div>
                            {(auth.loggedIn() && auth.isAdmin()) ? (
                            <div className='pull-right'>
                                <button type='button' className='btn btn-primary btn-xs'>
                                    <i className='fa'> edit </i>
                                </button>
                                <button type='button' className='btn btn-danger btn-xs' >
                                    <i className='fa'> delete </i>
                                </button>
                            </div>
                            ) : (<div></div>)}
                        </span>
                    </li>
                </ul>;
    }
  });

module.exports = UsersList;