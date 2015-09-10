import React from 'react';
import firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//ako ima pending ili finished ili rejected module, opcija all nece prikazivati taj module ali ostale opcije hoce
//ako je rejected i repeatable ne prikazuj ga u donjoj listi

let ModulesList = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        var userStatus = auth.getStatus();
        var userId = auth.getUserId();

        if (!auth.loggedIn()) { this.transitionTo('login'); };
        if (userStatus == "created") { this.transitionTo('changepassword', null, {id: userId});};
        return { modules: [], modulesForApproval: [], finishedModules: [], rejectedModules: [], taxonomy: [], taxonomySelected: 'All', modulesSelected: [] };
    },

    componentWillMount() {
        this.firebaseDb = new Firebase("https://app-todo-list.firebaseio.com/modules/");
        this.usersFb = new Firebase("https://app-todo-list.firebaseio.com/users/");
        this.taxonomyDb = new Firebase("https://app-todo-list.firebaseio.com/taxonomy/");
        this.getTaxonomy();

        if (!auth.isAdmin()) { this.getAllModulesForStudent();
                               this.getFinishedModulesForStudent();
        } else { this.getAllModulesForAdmin(); }
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
            var modulesForApprovalArray = this.state.modulesForApproval;
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
                        this.setState({ modules: modulesArray });
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
                        this.setState({ modulesForApproval: modulesForApprovalArray })
                    }
                    if (snap.key() == userId && data.approved && items.repeatable){
                        items.id = itemsKey;
                        modulesArray.push(items);
                        this.setState({ modules: modulesArray });
                    }
                    if (snap.key() == userId && data.rejected){
                        data.id = itemsKey;
                        data.title = items.title;
                        rejectedModulesArray.push(data);
                        this.setState({ rejectedModules: rejectedModulesArray });
                    }
                }.bind(this))
            } else {
                items.id = itemsKey;
                modulesArray.push(items);
                this.setState({ modules: modulesArray });
            }
        }.bind(this));
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
                    item.key = data.key();
                    var itemsKey = data.key();
                    if(item.approved){
                        this.firebaseDb.once("value", function(snap) {
                            if(snap.hasChild(itemsKey)){
                                item.deleted = false;
                                finishedModulesArray.push(item);
                                this.setState({ finishedModules: finishedModulesArray })
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
    },

    inputTaxonomyChange(e) {
        this.setState({taxonomySelected: e.target.value});

        var userId = auth.getUserId();
        var selected = e.target.value;
        var selectedModules = [];
        var selectedModulesArray = [];

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

                        if (snap.key() == userId && !data.approved && !data.rejected) {
                            selectedModulesArray.push(item);
                            this.setState({ modulesSelected: selectedModulesArray })
                        }
                    }.bind(this))
                }
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
                            this.setState({ modulesForApproval: modulesForApprovalArray })
                        }.bind(this))

                    }
                }.bind(this))
            }
            items.id = data.key();
            modulesArray.push(items);
            this.setState({ modules: modulesArray });
        }.bind(this));
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

        if(this.state.taxonomy != ''){ //remove this if
            var optionNodes = this.state.taxonomy.map(function(option){
                return <option value={option.value}>{option.name}</option>;
            });
        }

        sModules.forEach(function (selectedModule, i) {
            _singleItemsSelected.push(<ModuleItemSelected key={i} selectedModule={sModules[i]}  />);
        });

        return <div >
                    {(_singleItemsFor != '' && auth.isAdmin()) ? (<div><b className='approved'>Waiting for review</b> { _singleItemsFor }</div>) : (<div></div>)}
                    {(_singleItemsFor != '' && !auth.isAdmin()) ? (<div><b>Waiting for review</b> { _singleItemsFor }</div>) : (<div></div>)}
                    {(_singleItemsRejected != '') ? (<div className='marginTop'><b className='errorMessage'>Rejected</b> { _singleItemsRejected }</div>) : (<div></div>)}
                    {(!auth.isAdmin() && _singleItemsFinished != '') ? (<div className='marginTop'><b className='approved'>Finished</b> { _singleItemsFinished }</div>) : (<div></div>)}
                    <div className='marginTop'>
                        <select value={this.state.taxonomySelected} onChange={this.inputTaxonomyChange}>
                            <option value='All'>All</option>{optionNodes}
                        </select>
                    </div>
                    {this.state.taxonomySelected == 'All' ? (
                        _singleItems != '' ? (<div>{ _singleItems }</div>) : (<div></div>)
                    ) : ( _singleItemsSelected != '' ? (<div>{_singleItemsSelected}</div>) : (<div></div>))}
                    {auth.isAdmin() ? (<AddNewModuleButton />) : (<div></div>)}
               </div>;
    }
});

let ModuleItem = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return { value: this.props.module.title }
    },

    render() {
        var module = this.props.module;

        return <Link to="previewmodule" params={{ id: this.props.module.id }}>
                    <div className='marginTop itemBackground overflow paddingBottomSmall' key={ module.id }>
                        <div className='moduleKey'> {this.state.value} </div>
                    </div>
                </Link>;
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

    render() {
        var moduleForA = this.props.moduleForA;

        return <Link to="previewmoduleforapproval" params={{ moduleId: this.state.moduleIdVal, studentId: this.state.studentIdVal  }}>
                    <div className='marginTop itemBackground overflow paddingBottomSmall' key={ moduleForA.moduleId }>
                        {auth.isAdmin() ? (<div className='moduleKey approved'> {this.state.nameVal} - <b>{this.state.userVal}</b> </div>) : 
                        (<div className='moduleKey'> {this.state.nameVal} </div>)}
                    </div>
                </Link>;
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

    render() {
        var finishedModule = this.props.finishedModule;

        return <div>
                {this.state.deleted ? (
                    <div className='marginTop paddingBottomSmall itemBackgroundFinished overflow' key={ this.state.moduleIdVal }>
                        <div className='moduleKey linkFont'> {this.state.nameVal} <span className='fontExtraSmall paddingLeft'>(no longer available)</span> </div>
                    </div>
                ) : (
                    <Link to="previewmodule" params={{ id: this.state.moduleIdVal }}>
                        <div className='marginTop itemBackgroundFinished overflow paddingBottomSmall' key={ finishedModule.moduleId }>
                            <div className='moduleKey'> {this.state.nameVal} </div>
                        </div>
                    </Link>
                )}
                </div>
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

    render() {
        var rejectedModule = this.props.rejectedModule;

        return <Link to="previewmodule" params={{ id: this.state.moduleIdVal }}>
                    <div className='marginTop itemBackgroundRejected overflow paddingBottomSmall' key={ rejectedModule.moduleId }>
                        <div className='moduleKey'> {this.state.nameVal} </div>
                    </div>
                </Link>;
    }   
});

let ModuleItemSelected = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return {
            moduleIdVal: this.props.selectedModule.id,
            nameVal: this.props.selectedModule.title
        }
    },

    render() {
        var selectedModule = this.props.selectedModule;

        return <Link to="previewmodule" params={{ id: this.state.moduleIdVal }}>
                    <div className='marginTop itemBackground overflow paddingBottomSmall' key={ selectedModule.moduleId }>
                        <div className='moduleKey'> {this.state.nameVal} </div>
                    </div>
                </Link>;
    }   
});

let AddNewModuleButton = React.createClass({
    mixins: [Router.Navigation],

    redirectToNewModule() {
        this.transitionTo('newmodule');
    },

    render(){
        return <div className='paddingTopBig'><button className="button_example" onClick={this.redirectToNewModule}> Add new module </button></div>
    }
});

export default ModulesList;