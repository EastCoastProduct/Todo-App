import React from 'react';
import firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';


let ModulesList = React.createClass({
    mixins: [Router.Navigation],

    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState() {
        var currentRoutes = this.context.router.getCurrentRoutes();
        var lastRoute = currentRoutes[currentRoutes.length - 1];
        if(lastRoute.name != "login"){
            var element = document.body;
            element.className="";
        }

        var userStatus = auth.getStatus();
        var userId = auth.getUserId();

        if (!auth.loggedIn()) { this.transitionTo('login'); };
        if (userStatus == "created") { this.transitionTo('edituser', null, {id: userId});};
        return { modules: [], modulesForApproval: [], finishedModules: [], rejectedModules: [], taxonomy: [], taxonomySelected: 'All', modulesSelected: [], showModuleInfo: false };
    },

    componentWillMount() {
        this.firebaseDb = new Firebase("https://app-todo-list.firebaseio.com/modules/");
        this.usersFb = new Firebase("https://app-todo-list.firebaseio.com/users/");
        this.taxonomyDb = new Firebase("https://app-todo-list.firebaseio.com/taxonomy/");

        this.getTaxonomy();
        if (!auth.isAdmin()) { this.getAllModulesForStudent();
                               this.getFinishedModulesForStudent();
                               this.getWaitingForApprovalModulesForStudent();
                               this.getRejectedModulesForStudent();
        } else { this.getAllModulesForAdmin() }
    },

    componentWillUnmount() {
        this.firebaseDb.off();
        this.usersFb.off();
        this.taxonomyDb.off();
    },

    getTaxonomy(){
        this.taxonomyDb.on('child_added', function(snap){
            var data = snap.val();
            data.id = snap.key();
            var taxonomyArray = this.state.taxonomy;
            taxonomyArray.push(data);
            this.setState({taxonomy: taxonomyArray})
        }.bind(this))
    },

    getAllModulesForStudent() {
        this.firebaseDb.on("child_added", function(data) {
            var userId = auth.getUserId();
            var userName = auth.getUser();
            var modulesArray = this.state.modules;
            var items = data.val();
            var itemsKey = data.key();

            if (!items.users){
                items.id = itemsKey;
                items.status = "open";
                modulesArray.push(items);
                this.setState({ modules: modulesArray });
            } else {
                this.approvalDb = new Firebase(this.firebaseDb + '/' + itemsKey + '/users/');
                this.approvalDb.once("value", function(snap){
                    var data = snap.val();
                    if(snap.hasChild(userId)){
                        var moduserFb = new Firebase(this.approvalDb + '/' + userId);
                        var userModFb = new Firebase(this.usersFb + '/' + userId + '/modules/' + itemsKey);
                        moduserFb.once('value', function(snap){
                            var userData = snap.val();
                            if(userData.approved && items.repeatable){
                                items.id = itemsKey;
                                items.approved = true;
                                userModFb.once('value', function(snap){
                                    var uData = snap.val();
                                    items.repeated = uData.repeated;
                                    items.status = "open";
                                    modulesArray.push(items);
                                    this.setState({ modules: modulesArray });
                                }.bind(this))
                            }
                        }.bind(this))
                    } else {
                        items.id = itemsKey;
                        items.status = "open";
                        modulesArray.push(items);
                        this.setState({ modules: modulesArray });
                    }
                }.bind(this))
            }
        }.bind(this));
        this.firebaseDb.on('child_changed', function(snap){
            var userId = auth.getUserId();
            var item = snap.key();
            var changedFb = new Firebase(this.firebaseDb + '/' + item + '/users/');
            changedFb.once('value', function(snapshot){
                if(snapshot.hasChild(userId)){
                    var thisUserFb = new Firebase(changedFb + '/' + userId);
                    thisUserFb.once('value', function(snap){
                        var data = snap.val();
                        if(!data.approved){
                            var modulesArray = this.state.modules;
                            for (var i=0; i < modulesArray.length; i++) {
                                if (modulesArray[i] != undefined && (modulesArray[i].id === item)) {
                                    if(i>-1){
                                        delete modulesArray[i]
                                    }
                                }
                            }
                            modulesArray.filter(function(e){return e});
                            this.setState({modules: modulesArray})
                        }
                    }.bind(this))
                }
            }.bind(this))
        }.bind(this))
    },

    getWaitingForApprovalModulesForStudent() {
        this.firebaseDb.on('child_added', function(data){
            var userId = auth.getUserId();
            var userName = auth.getUser();
            var modulesForApprovalArray = this.state.modulesForApproval;
            var items = data.val();
            var itemsKey = data.key();

            if(items.users){
                this.approvalDb = new Firebase(this.firebaseDb + '/' + itemsKey + '/users/');
                this.approvalDb.once("value", function(snap){
                    var data = snap.val();
                    if(snap.hasChild(userId)){
                        var moduserFb = new Firebase(this.approvalDb + '/' + userId);
                        var userModFb = new Firebase(this.usersFb + '/' + userId + '/modules/' + itemsKey);
                        moduserFb.once('value', function(snap){
                            var userData = snap.val();
                            if(!userData.rejected && !userData.approved){
                                userData.id = itemsKey;
                                userData.title = items.title;
                                userData.studentId = userId;
                                userData.userName = userName;
                                userData.description = items.description;
                                userData.points = items.points;
                                userData.taxonomy = items.taxonomy;
                                userData.rejected = false;
                                userData.status = "waitingForApproval";
                                userData.repeatable = items.repeatable;
                                modulesForApprovalArray.push(userData);
                                this.setState({ modulesForApproval: modulesForApprovalArray })
                            }
                        }.bind(this))
                    }
                }.bind(this))
            }
        }.bind(this))
        //var moduserFb = new Firebase(this.approvalDb + '/' + userId);
        this.firebaseDb.on('child_changed', function(snap){
            if(!auth.isAdmin()){
                var modulesForApprovalArray = this.state.modulesForApproval;
                var userId = auth.getUserId();
                var userName = auth.getUser();
                var item = snap.val();
                item.id = snap.key();

                var moduserFb = new Firebase(this.firebaseDb + '/' + snap.key() + '/users/' + userId);
                var userModFb = new Firebase(this.usersFb + '/' + userId + '/modules/' + snap.key());
                moduserFb.once('value', function(snap){
                    var userData = snap.val();
                    if(!userData.rejected && !userData.approved){
                        item.studentId = userId;
                        item.userName = userName;
                        item.rejected = false;
                        item.status = "waitingForApproval";
                        item.comment = userData.comment;
                        item.solutionUrl = userData.solutionUrl;

                        modulesForApprovalArray.push(item);
                        
                            var arr = {};
                            for ( var i=0, len=modulesForApprovalArray.length; i < len; i++ )
                                arr[modulesForApprovalArray[i]['id']] = modulesForApprovalArray[i];

                            modulesForApprovalArray = new Array();
                            for ( var key in arr )
                                modulesForApprovalArray.push(arr[key]);
                        

                        this.setState({ modulesForApproval: modulesForApprovalArray })

                    }
                }.bind(this))
            }
        }.bind(this))
    },

    getRejectedModulesForStudent(){
        this.firebaseDb.on('child_added', function(data){
            var userId = auth.getUserId();
            var userName = auth.getUser();
            var rejectedModulesArray = this.state.rejectedModules;
            var items = data.val();
            var itemsKey = data.key();

            if(items.users){
                this.approvalDb = new Firebase(this.firebaseDb + '/' + itemsKey + '/users/');
                this.approvalDb.once("value", function(snap){
                    var data = snap.val();
                    if(snap.hasChild(userId)){
                        var moduserFb = new Firebase(this.approvalDb + '/' + userId);
                        var userModFb = new Firebase(this.usersFb + '/' + userId + '/modules/' + itemsKey);
                        moduserFb.once('value', function(snap){
                            var userData = snap.val();
                            if(userData.rejected){
                                userData.id = itemsKey;
                                userData.title = items.title;
                                userData.studentId = userId;
                                userData.userName = userName;
                                userData.description = items.description;
                                userData.points = items.points;
                                userData.taxonomy = items.taxonomy;
                                userData.status = "rejected";
                                userData.repeatable = items.repeatable;
                                rejectedModulesArray.push(userData);
                                this.setState({ rejectedModules: rejectedModulesArray })
                            }
                        }.bind(this))
                    }
                }.bind(this))
            }
        }.bind(this))
        this.firebaseDb.on('child_changed', function(snap){
            var userId = auth.getUserId();
            var item = snap.key();
            var changedFb = new Firebase(this.firebaseDb + '/' + item + '/users/');
            changedFb.once('value', function(snapshot){
                if(snapshot.hasChild(userId)){
                    var thisUserFb = new Firebase(changedFb + '/' + userId);
                    thisUserFb.once('value', function(snap){
                        var data = snap.val();
                        if(!data.rejected){
                            var rejectedModulesArray = this.state.rejectedModules;
                            for (var i=0; i < rejectedModulesArray.length; i++) {
                                if (rejectedModulesArray[i] != undefined && (rejectedModulesArray[i].id === item)) {
                                    if(i>-1){
                                        delete rejectedModulesArray[i]
                                    }
                                }
                            }
                            rejectedModulesArray.filter(function(e){return e});
                            this.setState({rejectedModules: rejectedModulesArray})
                        }
                    }.bind(this))
                }
            }.bind(this))
        }.bind(this))
    },

    getFinishedModulesForStudent(){
        var userId = auth.getUserId();
        var finishedModulesArray = this.state.finishedModules;
        var thisStudentFb = new Firebase(this.usersFb + '/' + userId);
        thisStudentFb.once('value', function(snapshot){
            if(snapshot.hasChild('modules')){
                var fb = new Firebase(thisStudentFb + '/modules');
                fb.on('child_added', function(data){
                    var item = data.val();
                    item.id = data.key();
                    var itemsKey = data.key();
                    if(item.approved){
                        this.firebaseDb.once("value", function(snap) {
                            var moddata = snap.val();
                            if(snap.hasChild(itemsKey)){
                                var modDb = new Firebase(this.firebaseDb + '/' + itemsKey);
                                modDb.once("value", function(snapshot){
                                    var mod = snapshot.val();
                                    item.description = mod.description;
                                    item.points = mod.points;
                                    item.taxonomy = mod.taxonomy;
                                    item.deleted = false;
                                    item.repeatable = mod.repeatable;
                                    finishedModulesArray.push(item);
                                    this.setState({ finishedModules: finishedModulesArray })
                                }.bind(this))
                            } else {
                                item.deleted = true;
                                finishedModulesArray.push(item);
                                this.setState({ finishedModules: finishedModulesArray })
                            }
                        }.bind(this))

                    }
                }.bind(this))
            }
        }.bind(this))
        this.firebaseDb.on('child_changed', function(snap){
            var userId = auth.getUserId();
            var item = snap.key();
            var changedFb = new Firebase(this.firebaseDb + '/' + item + '/users/');
            changedFb.once('value', function(snapshot){
                if(snapshot.hasChild(userId)){
                    var thisUserFb = new Firebase(changedFb + '/' + userId);
                    thisUserFb.once('value', function(snap){
                        var data = snap.val();
                        if(!data.approved){
                            var finishedModulesArray = this.state.finishedModules;
                            for (var i=0; i < finishedModulesArray.length; i++) {
                                if (finishedModulesArray[i] != undefined && (finishedModulesArray[i].id === item)) {
                                    if(i>-1){
                                        delete finishedModulesArray[i]
                                    }
                                }
                            }
                            finishedModulesArray.filter(function(e){return e});
                            this.setState({finishedModules: finishedModulesArray})
                        }
                    }.bind(this))
                }
            }.bind(this))
        }.bind(this))
    },

    inputTaxonomyChange(e) {
        this.setState({taxonomySelected: e.target.value});

        var userId = auth.getUserId();
        var selected = e.target.value;
        var selectedModulesArray = [];
        this.setState({ modulesSelected: [] })

        this.firebaseDb.orderByChild('taxonomy').startAt(selected).endAt(selected).once('value', function(snapshot){
            var data = snapshot.val();
            if(data == null) {
                this.setState({ modulesSelected: [] })
            } else {
                for (var k in data){
                    var moduleFb = new Firebase(this.firebaseDb + '/' + k);
                    moduleFb.once('value', function(snap){
                        var item = snap.val();
                        item.id = snap.key();
                        if(auth.isAdmin()){
                            if(item.taxonomy == selected){
                                var userFb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + snap.key() + '/users/');
                                userFb.on("child_added", function(snap){
                                    var checkUser = snap.val();
                                    if(!checkUser.approved){
                                        item.inProgress = "true";
                                    } else {
                                        item.inProgress = "false";
                                    }
                                }.bind(this))
                                selectedModulesArray.push(item);
                                this.setState({ modulesSelected: selectedModulesArray })
                            }
                        } else {
                            if(item.taxonomy == selected){
                                if(snap.hasChild('users')){
                                    var moduleUserFb = new Firebase(moduleFb + '/users');
                                    moduleUserFb.once('value', function(snapshot){
                                        if (snapshot.hasChild(userId)){
                                            var thisUserData = new Firebase(moduleUserFb + '/' + userId);
                                            thisUserData.once('value', function(sna){
                                                var moduleUserData = sna.val();

                                                var checkRepeatable = new Firebase(this.usersFb + '/' + userId + '/modules/' + snap.key())
                                                checkRepeatable.once('value', function(sn){
                                                    var rep = sn.val();
                                                    item.repeated = rep.repeated;
                                                    if(item.repeatable && moduleUserData.approved){ //jel treba ovdje repeatable
                                                        item.approved = true;
                                                        item.status = "open";
                                                        selectedModulesArray.push(item);
                                                        this.setState({ modulesSelected: selectedModulesArray })
                                                    }
                                                }.bind(this))
                                            }.bind(this))
                                        } else {
                                            item.status = "open";
                                            selectedModulesArray.push(item);
                                            this.setState({ modulesSelected: selectedModulesArray })
                                        }
                                    }.bind(this))
                                } else {
                                    item.status = "open";
                                    selectedModulesArray.push(item);
                                    this.setState({ modulesSelected: selectedModulesArray })
                                }
                            }
                        }
                    }.bind(this))
                }
            }
        }.bind(this));
        this.firebaseDb.on('child_changed', function(snap){
            var userId = auth.getUserId();
            var item = snap.key();
            var changedFb = new Firebase(this.firebaseDb + '/' + item + '/users/');
            changedFb.once('value', function(snapshot){
                if(snapshot.hasChild(userId)){
                    var thisUserFb = new Firebase(changedFb + '/' + userId);
                    thisUserFb.once('value', function(snap){
                        var data = snap.val();
                        if(!data.approved){
                            var selectedModulesArray = this.state.modulesSelected;
                            for (var i=0; i < selectedModulesArray.length; i++) {
                                if (selectedModulesArray[i] != undefined && (selectedModulesArray[i].id === item)) {
                                    if(i>-1){
                                        delete selectedModulesArray[i]
                                    }
                                }
                            }
                            selectedModulesArray.filter(function(e){return e});
                            this.setState({modulesSelected: selectedModulesArray})
                        }
                    }.bind(this))
                }
            }.bind(this))
        }.bind(this))
        this.firebaseDb.on('child_removed', function(snap){
            var selectedModulesArray = this.state.modulesSelected;
            var item = snap.key();
            for (var i=0; i < selectedModulesArray.length; i++) {
                if (selectedModulesArray[i] != undefined && (selectedModulesArray[i].id === item)) {
                    if(i>-1){
                        delete selectedModulesArray[i]
                    }
                }
            }
            selectedModulesArray.filter(function(e){return e});
            this.setState({modulesSelected: selectedModulesArray})
        }.bind(this))
    },

    getAllModulesForAdmin() {
        this.firebaseDb.on("child_added", function(data) {
            var modulesArray = this.state.modules;
            var modulesForApprovalArray = this.state.modulesForApproval;
            var items = data.val();
            var itemsKey = data.key();

            var inProgress = this.getProgressInfo(itemsKey);
            items.inProgress = this.state.moduleInProgress;
            if (items.users) {
                this.approvalDb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + data.key() + '/users/');
                this.approvalDb.on("child_added", function(snap) {
                    var data = snap.val();
                    if(!data.approved && !data.rejected){
                        var userId = snap.key();
                        this.userDataFb = new Firebase(this.usersFb + '/' + userId);
                        this.userModFb = new Firebase(this.usersFb + '/' + userId + '/modules/' + itemsKey);
                        this.userDataFb.once("value", function(snapshot) {
                            var user = snapshot.val();
                            data.userName = user.first_name + ' ' + user.last_name;
                            data.studentId = userId;
                            data.id = itemsKey;
                            data.title = items.title;
                            data.status = "waitingForApproval";
                            data.description = items.description;
                            data.points = items.points;
                            data.taxonomy = items.taxonomy;
                            data.repeatable = items.repeatable;
                            if(user.status != "inactive"){
                                this.userModFb.once('value', function(snap){
                                    var dataR = snap.val();
                                    data.repeated = dataR.repeated;
                                    modulesForApprovalArray.push(data);
                                    this.setState({ modulesForApproval: modulesForApprovalArray })
                                }.bind(this))
                            }
                        }.bind(this))
                    }
                }.bind(this))
            }
            items.id = data.key();
            modulesArray.push(items);
            this.setState({ modules: modulesArray });
        }.bind(this));
        this.firebaseDb.on('child_removed', function(snap){
            var modulesArray = this.state.modules;
            var item = snap.key();
            for (var i=0; i < modulesArray.length; i++) {
                if (modulesArray[i] != undefined && (modulesArray[i].id === item)) {
                    if(i>-1){
                        delete modulesArray[i]
                    }
                }
            }
            modulesArray.filter(function(e){return e});
            this.setState({modules: modulesArray})
        }.bind(this))
        //testirati ovo
        this.firebaseDb.on('child_changed', function(snap){
            if(auth.isAdmin()){
                var item = snap.key();
                var changedFb = new Firebase(this.firebaseDb + '/' + item + '/users/');
                changedFb.on('child_added', function(snapshot){
                    var data = snapshot.val();
                    var dataKey = snapshot.key();
                    if((data.approved) || (!data.approved && data.rejected && data.adminComment)){
                        var modulesForApprovalArray = this.state.modulesForApproval;
                        for (var i=0; i < modulesForApprovalArray.length; i++) {
                            if (modulesForApprovalArray[i] != undefined && (modulesForApprovalArray[i].id === item && modulesForApprovalArray[i].studentId === dataKey)) {
                                if(i>-1){
                                    delete modulesForApprovalArray[i]
                                }
                            }
                        }
                        modulesForApprovalArray.filter(function(e){return e});
                        this.setState({modulesForApproval: modulesForApprovalArray})
                    }
                }.bind(this))
            }
        }.bind(this))
    },

    showModuleInfo(module){
        this.setState({showModuleInfo: true, moddata: module.props.module })
    },

    showRejectedModuleInfo(module){
        this.setState({showModuleInfo: true, moddata: module.props.rejectedModule })
    },

    showFinishedModuleInfo(module){
        this.setState({showModuleInfo: true, moddata: module.props.finishedModule })
    },

    showWaitingModuleInfo(module){
        this.setState({showModuleInfo: true, moddata: module.props.moduleForA })
    },

    showSelectedModuleInfo(module){
        this.setState({showModuleInfo: true, moddata: module.props.selectedModule })
    },

    hideModuleInfo(module){
        this.setState({showModuleInfo: false })
    },

    getProgressInfo(id){
        this.setState({ moduleInProgress: "false" });
        var userFb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + id + '/users/');
        userFb.on("child_added", function(snap){
            var checkUser = snap.val();
            if(!checkUser.approved){
                this.setState({ moduleInProgress: "true" })
            } else {
                this.setState({ moduleInProgress: "false" })
            }
        }.bind(this))
    },

    deleteModule(module) {
        var itemForRemoval = new Firebase(this.firebaseDb + '/' + module.props.data.id);
        itemForRemoval.remove();
        this.setState({showModuleInfo: false});
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
        var sModules = this.state.modulesSelected;
        var _singleItemsSelected = [];
        var showModuleInfo = this.showModuleInfo;
        var showRejectedModuleInfo = this.showRejectedModuleInfo;
        var showFinishedModuleInfo = this.showFinishedModuleInfo;
        var showWaitingModuleInfo = this.showWaitingModuleInfo;
        var showSelectedModuleInfo = this.showSelectedModuleInfo;

        modules.forEach(function (module, i) {
            _singleItems.push(<ModuleItem key={i} module={modules[i]} onModuleItemClick={showModuleInfo} />);
        });

        modulesForA.forEach(function (moduleForA, i) {
            _singleItemsFor.push(<ModuleItemForA key={i} moduleForA={modulesForA[i]} onWaitingModuleItemClick={showWaitingModuleInfo}  />);
        });

        if(!auth.isAdmin()){
            finishedModules.forEach(function (finishedModule, i) {
                _singleItemsFinished.push(<ModuleItemFinished key={i} finishedModule={finishedModules[i]} onFinishedModuleItemClick={showFinishedModuleInfo} />);
            });
        }

        rejectedModules.forEach(function (rejectedModule, i) {
            _singleItemsRejected.push(<ModuleItemRejected key={i} rejectedModule={rejectedModules[i]} onRejectedModuleItemClick={showRejectedModuleInfo} />);
        });

        var optionNodes = this.state.taxonomy.map(function(option){
            return <option value={option.value}>{option.name}</option>;
        });

        sModules.forEach(function (selectedModule, i) {
            _singleItemsSelected.push(<ModuleItemSelected key={i} selectedModule={sModules[i]} onSelectedModuleItemClick={showSelectedModuleInfo} />);
        });

        return <div>
                    <div className="list">
                        {(_singleItemsFor != '' && auth.isAdmin()) ? (<div><b className='approved'>Waiting for review</b> { _singleItemsFor }</div>) : (<div></div>)}
                        {(_singleItemsFor != '' && !auth.isAdmin()) ? (<div><b>Waiting for review</b> { _singleItemsFor }</div>) : (<div></div>)}
                        {(_singleItemsRejected != '') ? (<div className='moduleItem '><b className='errorMessage'>Rejected</b> { _singleItemsRejected }</div>) : (<div></div>)}
                        {(!auth.isAdmin() && _singleItemsFinished != '') ? (<div className='moduleItem '><b className='approved'>Finished</b> { _singleItemsFinished }</div>) : (<div></div>)}
                        <div className=''>
                            <select className='selectDropdown adminFont' value={this.state.taxonomySelected} onChange={this.inputTaxonomyChange}>
                                <option value='All'>All</option>{optionNodes}
                            </select>
                        </div>
                        {this.state.taxonomySelected == 'All' ? (
                            _singleItems != '' ? (<div>{ _singleItems }</div>) : (<div></div>)
                        ) : ( _singleItemsSelected != '' ? (<div>{_singleItemsSelected}</div>) : (<div></div>))}
                        {auth.isAdmin() ? (<AddNewModuleButton />) : (<div></div>)}
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
        return({comment: '', solutionUrl: '', commentMessage: '', submittedAndWaiting: false, adminComment: '', adminCommentMessage: '', data: props.data, approved: false, rejected: false})
    },

    componentWillReceiveProps: function(nextProps, nextState) {
      if (nextProps.data !== this.props.data){
        if(auth.isAdmin()){
            this.setState({ adminComment: '', adminCommentMessage: '', approved: false, comment: '', commentMessage: '', data: nextProps.data, rejected: false, solutionUrl: '', submittedAndWaiting: false });
        } else {
            this.setState({comment: '', solutionUrl: '', commentMessage: '', submittedAndWaiting: false, adminComment: '', adminCommentMessage: '', data: nextProps.data, approved: false, rejected: false});
        }
      }
    },

    commentOnChange(e){
        this.setState({comment: e.target.value, commentMessage:''});
    },

    solutionUrlOnChange(e){
        this.setState({solutionUrl: e.target.value });
    },

    handleEdit(){
        this.transitionTo('editmodule', null, { id: this.props.data.id });
    },

    handleDelete(){
        this.props.onDelete(this);
    },

    showAllModules(){
        this.props.onModuleHide(this);
    },

    handleSubmitValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;

        if(this.state.comment.trim().length == 0){
            this.setState({ commentMessage: 'Enter comment.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

    onModuleSubmit(e) {
        var userId = auth.getUserId();
        var repeated;
        if(this.props.data.repeated == undefined){
            repeated = "0";
        } else {
            repeated = this.props.data.repeated;
        }
        e.preventDefault();
        this.handleSubmitValidation(res => {
            if(res){
                this.studentModuleFb = new Firebase("https://app-todo-list.firebaseio.com/users/" + userId + '/modules/');
                this.modulesApproval = new Firebase("https://app-todo-list.firebaseio.com/modules/" + this.props.data.id + '/users/');
                this.modulesApproval.child(userId).set({comment: this.state.comment, solutionUrl: this.state.solutionUrl, approved: false});
                this.studentModuleFb.child(this.props.data.id).set({approved: false, repeated: repeated });
                this.setState({submittedAndWaiting: true, comment: this.state.comment, solutionUrl: this.state.solutionUrl});
            }
        })
    },

    approveModule(){
        var usersFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.props.data.studentId);
        var pointsFb = new Firebase(usersFb + '/modules/');
        var studentFb = new Firebase(pointsFb + '/' + this.props.data.id);
        var moduleFb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + this.props.data.id);
        var moduleApprovalFb = new Firebase(moduleFb + '/users/' + this.props.data.studentId);

        usersFb.once("value", function(snapshot) {
            var pointsData = snapshot.val();
            if(snapshot.hasChild("total_points")){
                var oldPoints = parseInt(pointsData.total_points);
                var newPoints = String(oldPoints + parseInt(this.props.data.points));
                usersFb.update({ total_points: newPoints })
            } else (
                usersFb.update({ total_points: this.props.data.points })
            )
        }.bind(this))

        studentFb.once("value", function(snap){
            var data = snap.val();
            if (snap.hasChild("repeated")){
                var oldRepeated = parseInt(data.repeated);
                var newRepeate = String(oldRepeated + 1);
                moduleApprovalFb.update({ approved: true });
                studentFb.set({ approved: true, points: this.props.data.points, repeated: newRepeate, title: this.props.data.title });
                this.setState({ approved: true })
            } else {
                moduleApprovalFb.update({ approved: true });
                studentFb.set({ approved: true, points: this.props.data.points, repeated: "1", title: this.props.data.title });
                this.setState({ approved: true })
            }
        }.bind(this))
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;

        if(this.state.adminComment.trim().length == 0){
            this.setState({ adminCommentMessage: 'Enter reason for rejection.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

    rejectModule(e){
        var pointsFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.props.data.studentId + '/modules/');
        var studentFb = new Firebase(pointsFb + '/' + this.props.data.id);
        var moduleFb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + this.props.data.id);
        var moduleApprovalFb = new Firebase(moduleFb + '/users/' + this.props.data.studentId);

        e.preventDefault();
        this.handleValidation(res => {
            if(res){
                moduleApprovalFb.update({ approved: false, adminComment: this.state.adminComment, rejected: true, updated: true });
                studentFb.update({ rejected: true })
                this.setState({ approved: false, adminComment: '', rejected: true })
            }
        })
    },

    adminCommentOnChange(e){
        this.setState({adminComment: e.target.value, adminCommentMessage:''});
    },

    render() {
        var data = this.props.data;
        return <div>
                    <div className='points_total'>{data.points}</div>
                    <div className='headlineFont '>{data.title}</div>
                    {(auth.isAdmin() && data.status == "waitingForApproval") ? (<p>{data.userName}</p>) : (<div></div>)}
                    <p>{data.description}</p>

                    {!auth.isAdmin() ? (
                        <div>
                            {(data.approved && data.repeatable && data.repeated == 1 && !this.state.submittedAndWaiting) ?
                                (<p className='  approved'>This module is finished, you can repeat it!</p>) : (<div></div>)}

                            {(data.approved && data.repeatable && data.repeated > 1 && !this.state.submittedAndWaiting) ?
                                (<div><p className='  approved'>This module is finished, you can repeat it!</p>
                                 <p className='  approved'>You have repeated this module {data.repeated} times.</p></div>) : (<div></div>)}

                            {(data.approved && !data.repeatable) ? (<p className='  approved'>This module is finished!</p>) : (<div></div>)}

                            {/*?*/}
                            {!this.state.submittedAndWaiting && ((data.approved && data.repeatable) || data.status == "open") ?
                            (<div className='' id='changeData-form'>
                                <fieldset>
                                    <form onSubmit={this.onModuleSubmit}>
                                       <div className='fontSmall'>Why should you be awarded points?</div>
                                       <textarea rows={8} value={this.state.comment} onChange={this.commentOnChange}/>
                                       <div className='errorMessage'>{this.state.commentMessage}</div>
                                       <div className=' fontSmall'>URL (if applicable)</div>
                                       <input type = 'text' value={this.state.solutionUrl} onChange={this.solutionUrlOnChange} />
                                       <input type='submit' value='Submit for review'/>
                                   </form>
                               </fieldset>
                            </div>) : (<div></div>)}

                            {(!data.approved && !data.rejected && data.status == "waitingForApproval") || this.state.submittedAndWaiting ? (
                                <div>
                                    <p className='approved'>Module submitted, waiting for response from administrator!</p>
                                    <p className=''><b>Submission info</b></p><p className=''>{data.comment ? (data.comment) : (this.state.comment)}</p>
                                    {data.solutionUrl != '' ? (<p className=' '>{data.solutionUrl ? (data.solutionUrl) : (this.state.solutionUrl)}</p>):(<div></div>)}
                                </div>
                            ) : (<div></div>)}

                            {(data.rejected && !this.state.submittedAndWaiting) ? (<div>
                                        <div className='  errorMessage'>Not quite there yet.</div>
                                        <div className='errorMessage '><b>Reason:</b> {data.adminComment}</div>
                                        <div className='  approved'>Review your code and submit for review again!</div>
                                        <div className='' id='changeData-form'>
                                            <fieldset>
                                                <form onSubmit={this.onModuleSubmit}>
                                                   <div className='fontSmall'>Explain why you shoud be awarded points</div>
                                                   <textarea rows={8} value={this.state.comment} onChange={this.commentOnChange}/>
                                                   <div className='errorMessage'>{this.state.commentMessage}</div>
                                                   <div className=' fontSmall'>URL (if applicable)</div>
                                                   <input type = 'text' value={this.state.solutionUrl} onChange={this.solutionUrlOnChange} />
                                                   <input type='submit' value='Submit for review'/>
                                               </form>
                                           </fieldset>

                                       </div>
                                   </div>
                            ):(<div></div>)}
                        </div>
                    ) : (
                        <div>
                            {data.status == "waitingForApproval" && !this.state.approved && !this.state.rejected ? (
                                <div>
                                    <div>
                                        <div className='Big '><b>Submission info</b></div><div className=''>{data.comment}</div>
                                        {data.solutionUrl != '' ? (<div className=' '>{data.solutionUrl}</div>):(<div></div>)}
                                    </div>
                                    <div className=''>
                                        <div className=''><button className='button_example' onClick={this.approveModule}>Approve solution</button></div>
                                        <div className='' id='changeData-form'>
                                            <fieldset>
                                                <form onSubmit={this.rejectModule}>
                                                    <div className='fontSmall'>Reason for rejection:</div>
                                                    <textarea rows={8} value={this.state.adminComment} onChange={this.adminCommentOnChange}/>
                                                    <div className='errorMessage'>{this.state.adminCommentMessage}</div>
                                                    <input type='submit' value='Reject solution'/>
                                                </form>
                                            </fieldset>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {this.state.approved ? (<div className='approved  '>Solution is approved!</div>) : (<div></div>)}
                                    {(!this.state.approved && this.state.rejected) ? (
                                        <div className='errorMessage  '>Solution is rejected! <div className='errorMessage'><b>Reason:</b> {this.state.adminComment}</div></div>) : (<div></div>)}

                                    {data.status != "waitingForApproval" ? (
                                        <div className=" ">
                                            <button type='button' className="button_example marginRight" onClick={this.handleEdit}>Edit module</button>
                                            {data.inProgress == "true" ? (<div></div>) : (<button type='button' className="button_example" onClick={this.handleDelete}>Delete</button>)}
                                        </div>
                                    ) : (<div></div>)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className=' '><button className='close' onClick={this.showAllModules}>Close</button></div>
                    {(!data.repeatable) ? (<div className='  infoMessage'><span className='errorMessage'>*</span>&nbsp;&nbsp;<span>Module is not repeatable! </span></div>) :
                    (<div className=' infoMessage '><span className='errorMessage'>*</span>&nbsp;&nbsp;<span>Module is repeatable! </span></div>)}
                    {(data.inProgress == "true") ? (<div className='infoMessage '><span className='errorMessage'>*</span>&nbsp;&nbsp;<span>Module is in progress so it cannot be deleted! </span></div>) :
                    (<div></div>)}
                </div>;
    }
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return { value: this.props.module.title }
    },

    handleShowModuleInfo() {
        this.props.onModuleItemClick(this);
    },

    render() {
        var module = this.props.module;

        return <a onClick={this.handleShowModuleInfo}>
                    <div className='moduleItem  itemBackground overflow paddingBottomSmall' key={ module.id }>
                        <div className='moduleKey'> {this.state.value} </div>
                    </div>
                </a>;
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

    handleShowModuleInfo() {
        this.props.onRejectedModuleItemClick(this);
    },

    render() {
        var rejectedModule = this.props.rejectedModule;

        return <a onClick={this.handleShowModuleInfo}>
                    <div className='moduleItem  itemBackgroundRejected overflow paddingBottomSmall' key={ rejectedModule.moduleId }>
                        <div className='moduleKey'> {this.state.nameVal} </div>
                    </div>
                </a>;
    }
});

let ModuleItemFinished = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return {
            moduleIdVal: this.props.finishedModule.key,
            nameVal: this.props.finishedModule.title,
            deleted: this.props.finishedModule.deleted
        }
    },

    handleShowModuleInfo() {
        this.props.onFinishedModuleItemClick(this);
    },

    render() {
        var finishedModule = this.props.finishedModule;

        return <div>
                {this.state.deleted ? (
                    <div className='moduleItem  paddingBottomSmall itemBackgroundFinished overflow' key={ this.state.moduleIdVal }>
                        <div className='moduleKey'> {this.state.nameVal} <span className='fontExtraSmall '>(no longer available)</span> </div>
                    </div>
                ) : (
                    <a onClick={this.handleShowModuleInfo}>
                        <div className='moduleItem  itemBackgroundFinished overflow paddingBottomSmall' key={ finishedModule.moduleId }>
                            <div className='moduleKey'> {this.state.nameVal} </div>
                        </div>
                    </a>
                )}
                </div>
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

    handleShowModuleInfo() {
        this.props.onWaitingModuleItemClick(this);
    },

    render() {
        var moduleForA = this.props.moduleForA;

        return <a onClick={this.handleShowModuleInfo}>
                    <div className='moduleItem  itemBackground overflow paddingBottomSmall' key={ moduleForA.moduleId }>
                        {auth.isAdmin() ? (<div className='moduleKey approved'> {this.state.nameVal} - <b>{this.state.userVal}</b> </div>) :
                        (<div className='moduleKey'> {this.state.nameVal} </div>)}
                    </div>
                </a>;
    }
});

let ModuleItemSelected = React.createClass({
    mixins: [Router.Navigation],

    handleShowModuleInfo() {
        this.props.onSelectedModuleItemClick(this);
    },

    render() {
        var selectedModule = this.props.selectedModule;

        return <a onClick={this.handleShowModuleInfo}>
                    <div className='moduleItem  itemBackground overflow paddingBottomSmall' key={ selectedModule.id }>
                        <div className='moduleKey'> {selectedModule.title} </div>
                    </div>
                </a>;
    }
});

let AddNewModuleButton = React.createClass({
    mixins: [Router.Navigation],

    redirectToNewModule() {
        this.transitionTo('newmodule');
    },

    render(){
        return <div className=''><button className="button_example" onClick={this.redirectToNewModule}> Add new module </button></div>
    }
})

export default ModulesList;
