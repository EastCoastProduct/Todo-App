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
        console.log("mounted");
        this.currentUser = auth.getUserId();
        this.allusersFb = new Firebase('https://app-todo-list.firebaseio.com/users/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.currentUser);
        this.modulesFb = new Firebase('https://app-todo-list.firebaseio.com/modules/');
        this.getUserData();
        this.getModulesData();
        this.allusersFb.on("child_changed", function(snap){
            console.log("child changed");
            this.getUserData();
        }.bind(this));
    },

    componentWillUnmount() {
        this.userFb.off();
        this.modulesFb.off();
    },

    getUserData() {
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({ firstName: data.first_name, lastName: data.last_name, email: data.email, isAdmin: data.isAdmin });
            if (data.total_points) {
                this.setState({ totalPoints: data.total_points })
            }
            if(data.description){
                this.setState({ description: data.description })
            }
            if(data.image){
                this.setState({ image: data.image })
            }
        }.bind(this));
    },

    getModulesData(){
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
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
                    {this.state.image != '' ? (<div className='imageContainer'><div className='imageBox'><img className='usersImage'src={ this.state.image }/></div></div>) : (<div></div>)}
                    <div className='marginTopBig'><span><b>{ this.state.firstName }</b></span>&nbsp;<span><b>{ this.state.lastName }</b></span></div>
					<div>{ this.state.email }</div>
                    {(!this.state.isAdmin && this.state.totalPoints > 0) ? (<div><b>{ this.state.totalPoints }</b></div>) : (<div></div>)}
                    {(!this.state.isAdmin && this.state.modules != '') ? (<div>{ _singleItems }</div>) : (<div></div>)}
                    <div className='marginTopBig'><div>{ this.state.description }</div></div>
                    <div className='marginTopBig marginBottom'>
                        <span className='marginRight'><button className='button_example' onClick={this.editProfile}>Edit profile</button></span>
                        <span className='marginRight'><button className='button_example' onClick = {this.changeEmail}>Change email</button></span>
                        <span className='marginRight'><button className='button_example' onClick = {this.changePassword}>Change password</button></span>
                    </div>
				</div>;
	}
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],
    
    getInitialState() {
        return { name: this.props.user.moduleName, points: this.props.user.points }
    },

    render() {
      var module = this.props.module;
    
      return <div>
                <span> {this.state.points} - </span>
                <span> {this.state.name} </span>
             </div>;
    }
});

export default MyAccount;