import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let UserInfo = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { id: this.props.params.id, modules: [], totalPoints: '0', image: '', showModuleInfo: false };
	},

	componentWillMount() {
        this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
        this.getUserData();
        this.userStatus = auth.getStatus();
        this.currentUser = auth.getUserId();
    },

    componentWillUnmount() {
        this.firebaseDb.off();
        this.userFb.off();
    },

    getUserData() {
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({ firstName: data.first_name, lastName: data.last_name, email: data.email, isAdmin: data.isAdmin });
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
                        var moduleInfoDb = new Firebase(this.firebaseDb + '/modules/' + id);
                        var subissionInfoDb = new Firebase(moduleInfoDb + '/users/' + this.state.id);
                        moduleInfoDb.once('value', function(snapshot){
                            var modData = snapshot.val();
                            if(modData == null){
                                var deletedModuleData = {};
                                deletedModuleData.title = userModuleData.title;
                                deletedModuleData.points = userModuleData.repeated;
                                deletedModuleData.repeated = userModuleData.repeated;
                                deletedModuleData.deleted = true;
                                modulesArray.push(deletedModuleData);
                                this.setState({ modules: modulesArray });
                            } else {
                                modData.id = snapshot.key();
                                modData.repeated = userModuleData.repeated;
                                subissionInfoDb.once('value', function(snaps){
                                    var subissionData = snaps.val();
                                    modData.comment = subissionData.comment;
                                    modData.solutionUrl = subissionData.solutionUrl;
                                    modulesArray.push(modData);
                                    this.setState({ modules: modulesArray });
                                }.bind(this))
                            }
                        }.bind(this))
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
            this.transitionTo('edituser', null, {id: this.currentUser});
        } else {
            this.userFb.update({ status: "inactive" });
            this.transitionTo('users');
        }
    },

    editAccount(){
        if (this.userStatus == "created") {
            this.transitionTo('edituser', null, {id: this.currentUser});
        } else {
            this.transitionTo('edituser', null, {id: this.state.id})
        }
    },

    showModuleInfo(module){
        this.setState({showModuleInfo: true, moddata: module.props.user })
    },

    hideModuleInfo(module){
        this.setState({showModuleInfo: false })
    },

	render() {
        var modules = this.state.modules;
        var _singleItems = [];
        var showModuleInfo = this.showModuleInfo;

        modules.forEach(function (module, i) {
        _singleItems.push(<ModuleItem key={i} user={modules[i]} onModuleItemClick={showModuleInfo}/>);
        });

		return <div>
                <div className='list'>
                    <div className='profile'>
                        {this.state.image != '' ? (<div className="profile_usersImage"><img src={ this.state.image }/></div>) : (<div></div>)}
                        <div className='paddingTop'><h2>{ this.state.firstName }&nbsp;{ this.state.lastName }</h2></div>
    					<div><div className='lightFont'>{ this.state.email }</div></div>
					    {(!this.state.isAdmin && this.state.totalPoints > 0) ? (
					       <div><div className='lightFont'>Total points: { this.state.totalPoints }</div></div>) : (<div></div>)}
                        {this.state.description ? (
                            <div><div className='description'>{ this.state.description }</div></div>) : (<div></div>)}
                        {(!this.state.isAdmin && this.state.modules != '') ? (
                            <div><div className='clr'></div>
							<div className=' paddingTop lightFont'>Finished modules</div><div>{ _singleItems }</div></div>) : (<div></div>)}
                        {auth.isAdmin() ? (<div className='paddingTopBig user'><span className='marginRight'><button className='button_example' onClick={this.deleteAccount}>Delete account</button></span>
                                            <span className='marginRight'><button className='button_example' onClick={this.editAccount}>Edit account</button></span></div>) : (<span></span>)}
                        <div className='user paddingTopBig'><span className='marginRight'><button className='button_example' onClick={this.showAllUsers}>Show all users</button></span></div>
                    </div>
                </div>
                <div className="right-sidebar">
                    { this.state.showModuleInfo ? <ModuleItemPreview data={this.state.moddata} onDelete={this.deleteModule} onModuleHide={this.hideModuleInfo} /> : null }
                </div>
              </div>;
	}
});

let ModuleItemPreview = React.createClass({
    mixins: [Router.Navigation],

    getInitialState(props){
        props = props || this.props;
        return({comment: '', solutionUrl: '', data: props.user})
    },

    componentWillReceiveProps: function(nextProps, nextState) {
      if (nextProps.data.id !== this.props.data.id){
        this.setState({comment: '', solutionUrl: '', data: nextProps.data});
      }
    },

    showAllModules(){
        this.props.onModuleHide(this);
    },

    render() {
        var data = this.props.data;
        return <div>
                    <div className='points_total'>{data.points}</div>
                    <div className='headlineFont '>{data.title}</div>
                    <p>{data.description}</p>
                    <p><b>Submission info:</b></p>
                    <div>{data.comment}</div>
                    <div>{data.solutionUrl}</div>
                    <div className=' '><button className='close' onClick={this.showAllModules}>Close</button></div>
                </div>;
    }
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],

    handleShowModuleInfo() {
        this.props.onModuleItemClick(this);
    },

    render() {
      var module = this.props.user;

      return  <div>
                {module.deleted ? (
                    <div className='moduleItem  itemBackground overflow paddingBottomSmall' key={ module.id }>
                        <span>{module.points} - </span>
                        <span>{module.title}</span>
                        {module.repeated > 1 ? (<span className='fontExtraSmall'> - repeated {module.repeated} times</span>) : (<span></span>)}
                        <span className='fontExtraSmall'> (no longer available)</span>
                    </div>
                ):(
                    <a onClick={this.handleShowModuleInfo}>
                        <div className='moduleItem  itemBackground overflow paddingBottomSmall' key={ module.id }>
                            <span>{module.points} - </span>
                            <span>{module.title}</span>
                            {module.repeated > 1 ? (<span className='fontExtraSmall'> - repeated {module.repeated} times</span>) : (<span></span>)}
                        </div>
                    </a>
                )}
            </div>;
    }
  });

export default UserInfo;
