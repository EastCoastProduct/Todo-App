import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let UserInfo = React.createClass({
	mixins: [Router.Navigation],
    
	getInitialState() {
		return { id: this.props.params.id, modules: [], totalPoints: '0', image: '' };
	},

	componentWillMount() {
        this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
        this.getUserData();
        this.userStatus = auth.getStatus();
        this.currentUser = auth.getUserId();
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
                email: data.email,
                isAdmin: data.isAdmin
            });
            if (data.total_points) {
                this.setState({ totalPoints: data.total_points })
            }
            if (data.description) {
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
                        var moduleInfo = { moduleName: userModuleData.title, points: userModuleData.points, repeated: userModuleData.repeated };
                        modulesArray.push(moduleInfo);
                        this.setState({ modules: modulesArray });
                    }
                }.bind(this))
            }
        }.bind(this));
    },

    showAllUsers() {
        this.transitionTo('users');
    },

    deleteAccount(){
        if (this.userStatus == "created") {
            this.transitionTo('changepassword', null, {id: this.currentUser});
        } else {
            this.userFb.update({ status: "inactive" });
            this.transitionTo('users');
        }
    },

    editAccount(){
        if (this.userStatus == "created") {
            this.transitionTo('changepassword', null, {id: this.currentUser});
        } else {
            this.transitionTo('edituser', null, {id: this.state.id})
        }
    },

	render() {
        var modules = this.state.modules;
        var _singleItems = [];

        modules.forEach(function (module, i) {
        _singleItems.push(<ModuleItem key={i} user={modules[i]} />);
        });

		return <div>
                    {this.state.image != '' ? (<div><img className="usersImage" src={ this.state.image }/></div>) : (<div></div>)}
					<div className='paddingTop'><div className='infoKey lightFont'>First name</div><div className='infoValue'>{ this.state.firstName }</div></div>
                    <div><div className='infoKey lightFont'>Last name</div><div className='infoValue'>{ this.state.lastName }</div></div>
					<div><div className='infoKey lightFont'>E-mail</div><div className='infoValue'>{ this.state.email }</div></div>
                    {this.state.description ? (<div><div className='infoKey lightFont'>Description</div><div className='infoValue'>{ this.state.description }</div></div>) : (<div></div>)}
                    {(!this.state.isAdmin && this.state.totalPoints > 0) ? (
                    <div><div className='infoKey lightFont'>Total points</div><div className='infoValue'>{ this.state.totalPoints }</div></div>) : (<div></div>)}
                    {(!this.state.isAdmin && this.state.modules != '') ? (   
                        <div><div className='infoKey paddingTop lightFont'>Finished modules</div><div>{ _singleItems }</div></div>) : 
                    (<div></div>)}
                    {auth.isAdmin() ? (<div className='paddingTopBig userInfoKey'><span className='marginRight'><button className='button_example' onClick={this.deleteAccount}>Delete account</button></span>
                                       <span className='marginRight'><button className='button_example' onClick={this.editAccount}>Edit account</button></span></div>) : (<span></span>)}
                    <div className='userInfoValue paddingTopBig'><span className='marginRight'><button className='button_example' onClick={this.showAllUsers}>Show all users</button></span></div>
				</div>;
	}
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],
    
    getInitialState() {
        return { name: this.props.user.moduleName, points: this.props.user.points, repeated: this.props.user.repeated }
    },

    render() {
      var module = this.props.module;
    
      return <div>
                <span>{this.state.points} - </span>
                <span>{this.state.name}</span>
                {this.state.repeated > 1 ? (<span className='fontExtraSmall'> - repeated {this.state.repeated} times</span>) : (<span></span>)}
            </div>;
    }
  });

export default UserInfo;