import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let UserInfo = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
        var showUserInfo = false;
        var id = null;
        if(this.props){
            if(this.props.params){
                if(this.props.params.id){
                    showUserInfo = true;
                    id = this.props.params.id;
                }
            }
        }
		return { id: id, modules: [], totalPoints: '0', image: '', showModuleInfo: false, showUserInfo: showUserInfo };
	},

	componentWillMount() {
        if(this.state.id != null){
            this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
            this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
            this.userModulesFb = new Firebase(this.userFb + '/modules');
            this.getUserData();
            this.userStatus = auth.getStatus();
            this.currentUser = auth.getUserId();
        }
    },

    componentWillUnmount() {
        this.firebaseDb.off();
        this.userFb.off();
        this.userModulesFb.off();
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
            var modulesFb = new Firebase(this.userFb + '/modules');
            modulesFb.on('child_added', function(snap){
                var dataId = snap.key();
                if(dataId != null){
                    var modUserFb = new Firebase(this.firebaseDb + '/modules/' + dataId + '/users/' + this.state.id);
                    modUserFb.remove();
                }
            }.bind(this))
            modulesFb.remove();
            this.userFb.update({ status: "inactive", total_points: "0" });
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
                {this.state.showUserInfo ? (
                    <div>
                        <div className="leftUserInfo">
                            {this.state.image != '' ? (<div className='imageContainer'><div className='imageBox'><img className='usersImage'src={ this.state.image }/></div></div>) : (<div></div>)}
                            <div className='content'>
                                <h2><span className='firstname'>{ this.state.firstName }</span><br /><span className='lastname'>{ this.state.lastName }</span></h2>
                                {(!this.state.isAdmin && this.state.totalPoints > 0) ? (<div className='points_total'>{ this.state.totalPoints }</div>) : (<div></div>)}
                                <p className='description'>{ this.state.description }</p>
                                <p className='meta'>{ this.state.email }</p>
                                <div className='marginTopBig marginBottom'>
                                    <span className='marginRight'><button className='button_example' onClick={this.showAllUsers}>Show all users</button></span>
                                </div>
                            </div>
                        </div>
                        <div className='rightUserInfo'>
                            <div className='list'>
                                {(!this.state.isAdmin && this.state.modules != '') ? (
                                    <div><div className='clr'></div>
                                    <div className=' paddingTop lightFont'>Finished modules</div><div>{ _singleItems }</div></div>) : (<div></div>)}
                            </div>
                            <div className="right-sidebar">
                                { this.state.showModuleInfo ? <ModuleItemPreview data={this.state.moddata} onDelete={this.deleteModule} onModuleHide={this.hideModuleInfo} /> : null }
                            </div>
                        </div>
                    </div>
                ) : (null)}
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
