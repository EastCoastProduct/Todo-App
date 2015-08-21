import React from 'react';
import firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//add filtering
//add paging

let ModulesList = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        var userStatus = auth.getStatus();
        var userId = auth.getUserId();

        if (!auth.loggedIn()) {
            this.transitionTo('login');
        };
        if (userStatus == "created") {
            this.transitionTo('changepassword', null, {id: userId});
        };
        return { modules: [], modulesForApproval: [], finishedModules: [], rejectedModules: [] };
    },

    componentWillMount() {
        this.firebaseDb = new Firebase("https://app-todo-list.firebaseio.com/modules/");
        this.usersFb = new Firebase("https://app-todo-list.firebaseio.com/users/");
        if (!auth.isAdmin()) {
            this.getAllModulesForStudent();
        } else {
            this.getAllModulesForAdmin();
        }
    },

    getAllModulesForStudent() {
        this.firebaseDb.on("child_added", function(data) {
            var userId = auth.getUserId();
            var userName = auth.getUser();
            var modulesArray = this.state.modules;
            var modulesForApprovalArray = this.state.modulesForApproval;
            var finishedModulesArray = this.state.finishedModules;
            var rejectedModulesArray = this.state.rejectedModules;
            var items = data.val();
            var itemsKey = data.key();
            if (items.users) {
                this.approvalDb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + data.key() + '/users/');
                this.approvalDb.once("value", function(snap){
                    var data = snap.val();
                    if(!snap.hasChild(userId)){
                        items.id = itemsKey;
                        modulesArray.push(items);
                        this.setState({
                            modules: modulesArray
                        });
                    }
                }.bind(this));
                this.approvalDb.on("child_added", function(snap) {
                    var data = snap.val();
                    if(snap.key() == userId && !data.approved && !data.rejected){
                        data.id = itemsKey;
                        data.title = items.title;
                        data.studentId = userId;
                        data.userName = userName;
                        modulesForApprovalArray.push(data);
                        this.setState({
                            modulesForApproval: modulesForApprovalArray
                        })
                    }
                    if (snap.key() == userId && data.approved) {
                        data.id = itemsKey;
                        data.title = items.title;
                        finishedModulesArray.push(data);
                        this.setState({
                            finishedModules: finishedModulesArray
                        })
                    }
                    if (snap.key() == userId && data.approved && items.repeatable){
                        items.id = itemsKey;
                        modulesArray.push(items);
                        this.setState({
                            modules: modulesArray
                        });
                    }
                    if (snap.key() == userId && data.rejected){
                        data.id = itemsKey;
                        data.title = items.title;
                        rejectedModulesArray.push(data);
                        this.setState({
                            rejectedModules: rejectedModulesArray
                        });
                    }
                }.bind(this))
            } else {
                items.id = itemsKey;
                modulesArray.push(items);
                this.setState({
                    modules: modulesArray
                });
            }
        }.bind(this));
    },

    getAllModulesForAdmin() {
        this.firebaseDb.on("child_added", function(data) {
            var modulesArray = this.state.modules;
            var modulesForApprovalArray = this.state.modulesForApproval;
            var rejectedModulesArray = this.state.rejectedModules;
            var items = data.val();
            var itemsKey = data.key();
            if (items.users) {
                this.approvalDb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + data.key() + '/users/');
                this.approvalDb.on("child_added", function(snap) {
                    var data = snap.val();
                    if(!data.approved && !data.rejected){
                        var userId = snap.key();
                        this.userDataFb = new Firebase(this.usersFb + '/' + userId);
                        this.userDataFb.once("value", function(snapshot) {
                            var user = snapshot.val();
                            data.userName = user.first_name + ' ' + user.last_name;
                            data.studentId = userId;
                            data.id = itemsKey;
                            data.title = items.title;
                            modulesForApprovalArray.push(data);
                            this.setState({
                                modulesForApproval: modulesForApprovalArray
                            })
                        }.bind(this))
                    }
                }.bind(this))
            }
            items.id = data.key();
            modulesArray.push(items);
            this.setState({
                modules: modulesArray
            });
        }.bind(this));
    },

    componentWillUnmount() {
        this.firebaseDb.off();
    },

    render() {
        var modules = this.state.modules;
        var _singleItems = [];
        var modulesForA = this.state.modulesForApproval;
        var _singleItemsFor = [];
        var finishedModules = this.state.finishedModules;
        var _singleItemsFinished = [];
        var rejectedModules = this.state.rejectedModules;
        var _singleItemsRejected = [];

        modules.forEach(function (module, i) {
            _singleItems.push(<ModuleItem key={i} module={modules[i]}  />);
        });

        modulesForA.forEach(function (moduleForA, i) {
            _singleItemsFor.push(<ModuleItemForA key={i} moduleForA={modulesForA[i]}  />);
        });

        if(!auth.isAdmin()){
            finishedModules.forEach(function (finishedModule, i) {
                _singleItemsFinished.push(<ModuleItemFinished key={i} finishedModule={finishedModules[i]} />);
            });
        }

        rejectedModules.forEach(function (rejectedModule, i) {
            _singleItemsRejected.push(<ModuleItemRejected key={i} rejectedModule={rejectedModules[i]} />);
        });

        return <div>
                    {(_singleItemsFor != '') ? (<div>Modules waiting for approval: { _singleItemsFor }</div>) : 
                    (<div>Modules waiting for approval: No modules</div>)}
                    {(_singleItemsRejected != '') ? (<div>Rejected modules: { _singleItemsRejected }</div>) : 
                    (<div></div>)}
                    {(!auth.isAdmin() && _singleItemsFinished != '') ? (<div>Finished modules: { _singleItemsFinished }</div>) : (<div></div>)}
                    {(!auth.isAdmin() && _singleItemsFinished == '') ? (<div>Finished modules: No modules</div>) : (<div></div>)}
                    {_singleItems != '' ? (<div>All modules: { _singleItems }</div>) : (<div>All modules: No modules</div>)}
                    {auth.isAdmin() ? (<AddNewModuleButton />) : (<div></div>)}
               </div>;
    }
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return { value: this.props.module.title }
    },

    preview() {
        this.transitionTo('previewmodule', null, { id: this.props.module.id });
    },

    render() {
        var module = this.props.module;

        return <ul>
                  <li key={ module.id }>
                        <span>
                            <div> {this.state.value} </div>
                            <div>
                                <button type='button' onClick={this.preview}><i> preview </i></button>
                            </div>
                        </span>
                    </li>
                </ul>;
    }   
});

let ModuleItemForA = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return {
            nameVal: this.props.moduleForA.title,
            userVal: this.props.moduleForA.userName,
            moduleIdVal: this.props.moduleForA.id,
            studentIdVal: this.props.moduleForA.studentId
        }
    },

    preview() {
        this.transitionTo('previewmoduleforapproval', null, { moduleId: this.state.moduleIdVal, studentId: this.state.studentIdVal });
    },

    render() {
        var moduleForA = this.props.moduleForA;

        return <ul>
                  <li key={ moduleForA.moduleId }>
                        <span>
                        {auth.isAdmin() ? (<div> {this.state.nameVal} {this.state.userVal} </div>) : (
                            <div> {this.state.nameVal} </div> )}
                            <div><button type='button' onClick={this.preview}><i> preview </i></button></div>
                        </span>
                    </li>
                </ul>;
    }   
});

let ModuleItemFinished = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return {
            moduleIdVal: this.props.finishedModule.id,
            nameVal: this.props.finishedModule.title
        }
    },

    preview() {
        this.transitionTo('previewmodule', null, { id: this.state.moduleIdVal });
    },

    render() {
        var finishedModule = this.props.finishedModule;

        return <ul>
                  <li key={ finishedModule.moduleId }>
                        <span>
                        <div> {this.state.nameVal} </div>
                            <div><button type='button' onClick={this.preview}><i> preview </i></button></div>
                        </span>
                    </li>
                </ul>;
    }   
});

let ModuleItemRejected = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return {
            moduleIdVal: this.props.rejectedModule.id,
            nameVal: this.props.rejectedModule.title
        }
    },

    preview() {
        this.transitionTo('previewmodule', null, { id: this.state.moduleIdVal });
    },

    render() {
        var rejectedModule = this.props.rejectedModule;

        return <ul>
                  <li key={ rejectedModule.moduleId }>
                        <span>
                        <div> {this.state.nameVal} </div>
                            <div><button type='button' onClick={this.preview}><i> preview </i></button></div>
                        </span>
                    </li>
                </ul>;
    }   
});

let AddNewModuleButton = React.createClass({
    mixins: [Router.Navigation],

    redirectToNewModule() {
        this.transitionTo('newmodule');
    },

    render(){
        return <div><button onClick={this.redirectToNewModule}> Add new module </button></div>
    }
});

module.exports = ModulesList;