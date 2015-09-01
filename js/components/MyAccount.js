import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';

let MyAccount = React.createClass({
	mixins: [Router.Navigation],
    
	getInitialState() {
		return { modules: [], totalPoints: '0', image: '' };
	},

	componentWillMount() {
        this.currentUser = auth.getUserId();
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.currentUser);
        this.modulesFb = new Firebase('https://app-todo-list.firebaseio.com/modules/');
        this.getUserData();
    },

    componentWillUnmount() {
        this.userFb.off();
        this.modulesFb.off();
    },

    getUserData() {
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({
                firstName: data.first_name,
                lastName: data.last_name,
                email: data.email,
                isAdmin: data.isAdmin
            });
            if (data.total_points) {
                this.setState({ totalPoints: data.total_points })
            }
            if(data.description){
                this.setState({ description: data.description })
            }
            if(data.image){
                this.setState({ image: data.image })
            }
            if (data.modules) {
                this.userModulesFb = new Firebase(this.userFb + '/modules');
                var modulesArray = this.state.modules; 
                this.userModulesFb.on("child_added", function(snap) {
                    var id = snap.key();
                    var userModuleData = snap.val();
                    if(userModuleData.approved) {
                        this.moduleUserFb = new Firebase(this.modulesFb + '/' + id);
                        this.moduleUserFb.once("value", function(snap2) {
                            var data2 = snap2.val();
                            var moduleInfo = {moduleName: data2.title, points: userModuleData.points};
                            modulesArray.push(moduleInfo);
                            this.setState({ modules: modulesArray });
                        }.bind(this))
                    }
                }.bind(this))
            }
        }.bind(this));
    },

    editProfile() {
        this.transitionTo('edituser', null, { id: this.currentUser });
    },

    changeEmail(){
        this.transitionTo('changeemail', null, { id: this.currentUser });
    },

    changePassword(){
        this.transitionTo('changepassword', null, { id: this.currentUser });
    },

	render() {
        var modules = this.state.modules;
        var _singleItems = [];

        modules.forEach(function (module, i) {
        _singleItems.push(<ModuleItem key={i} user={modules[i]} />);
        });

		return <div>
                    {this.state.image != '' ? (<div><img className="usersImage" src={ this.state.image }/></div>) : (<div></div>)}
					<div><span>First name:</span><div>{ this.state.firstName }</div></div>
			        <div><span>Last name:</span><div>{ this.state.lastName }</div></div>
					<div><span>E-mail address:</span><div>{ this.state.email }</div></div>
                    <div><span>Description:</span><div>{ this.state.description }</div></div>
                    {(!this.state.isAdmin) ? (
                        <div><span>Total points:</span><div>{ this.state.totalPoints }</div></div>) : (<div></div>)}
                    {(!this.state.isAdmin && this.state.modules != '') ? (   
                        <div><span>Finished modules:</span><div>{ _singleItems }</div></div>) : (<div></div>)}
                    {(!this.state.isAdmin && this.state.modules == '') ? (   
                        <div><span>Finished modules:</span><div>No finished modules</div></div>) : (<div></div>)}
                    <div>
                        <span><button onClick={this.editProfile}>Edit profile</button></span>
                        <span><button onClick = {this.changeEmail}>Change email</button></span>
                        <span><button onClick = {this.changePassword}>Change password</button></span>
                    </div>
				</div>;
	}
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],
    
    getInitialState() {
        return {
            name: this.props.user.moduleName,
            points: this.props.user.points
        }
    },

    render() {
      var module = this.props.module;
    
      return <ul>
                  <li>
                        <span>
                            <span>Module: {this.state.name} </span>
                            <span>Points: {this.state.points}</span>
                        </span>
                    </li>
                </ul>;
    }
});

module.exports = MyAccount;