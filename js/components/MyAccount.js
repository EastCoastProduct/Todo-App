import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';

//opet se ne refresha na data change

let MyAccount = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { modules: [], totalPoints: '0', image: '' };
	},

	componentWillMount() {
        this.currentUser = auth.getUserId();
        this.allusersFb = new Firebase('https://app-todo-list.firebaseio.com/users/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.currentUser);
        this.getUserData();
        this.getModulesData();
        this.allusersFb.on("child_changed", function(snap){
            this.getUserData();
        }.bind(this));
        this.allusersFb.on("child_added", function(snap){
            this.getUserData();
        }.bind(this));
        this.userFb.on("child_removed", function(snap){
            this.getUserData();
        }.bind(this));
    },

    componentWillUnmount() {
        this.userFb.off();
        this.allusersFb.off();
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
            } else { this.setState({ image: '' })}
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
                        var moduleInfo = {moduleName: userModuleData.title, points: userModuleData.points, repeated: userModuleData.repeated};
                        modulesArray.push(moduleInfo);
                        this.setState({ modules: modulesArray });
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
										<div className='content'>
										<h2><span className='firstname'>{ this.state.firstName }</span><br /><span className='lastname'>{ this.state.lastName }</span></h2>
                    {(!this.state.isAdmin && this.state.totalPoints > 0) ? (<div className='points_total'>{ this.state.totalPoints }</div>) : (<div></div>)}
                    {(!this.state.isAdmin && this.state.modules != '') ? (<div className='points_modules'>{ _singleItems }</div>) : (<div></div>)}
                    <p className='description'>{ this.state.description }</p>
										<p className='meta'>{ this.state.email }</p>
                    <div className='marginTopBig marginBottom'>
                        <span className='marginRight'><button className='button_example' onClick={this.editProfile}>Edit profile</button></span>
                        <span className='marginRight'><button className='button_example' onClick = {this.changeEmail}>Change email</button></span>
                        <span className='marginRight'><button className='button_example' onClick = {this.changePassword}>Change password</button></span>
                    </div>
										</div>
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
                <span> {this.state.points} - </span>
                <span> {this.state.name} </span>
                {this.state.repeated > 1 ? (<span className='fontExtraSmall'> - repeated {this.state.repeated} times</span>) : (<span></span>)}
             </div>;
    }
});

export default MyAccount;
