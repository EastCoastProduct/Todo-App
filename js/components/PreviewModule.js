import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//popraviti brisanje modula

var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules/');
var userFb = new Firebase('https://app-todo-list.firebaseio.com/users/');

let PreviewModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { id: this.props.params.id, userId: auth.getUserId(), submitted: false, moduleInProgress: "false", comment: '', solutionUrl:'' };
	},

	componentWillMount() {
        this.studentModuleFb = new Firebase(userFb + '/' + this.state.userId + '/modules/');
        this.moduleFb = new Firebase(firebaseDb + '/' + this.state.id + '/users/' + this.state.userId);
        this.getBasicModuleData();
        if(!auth.isAdmin()) { this.getModuleDataForStudent(); }
    },

    componentWillUnmount() {
        firebaseDb.off();
        userFb.off();
    },

    getBasicModuleData() {
        var id = this.state.id;
        var moduleDataFb = new Firebase(firebaseDb + '/' + id);
        var title, description, taxonomy, points, repeatable;

        moduleDataFb.once('value', function(snapshot){
            var data = snapshot.val();
            title = data.title;
            description = data.description;
            taxonomy = data.taxonomy;
            points = data.points;
            if(data.repeatable) { repeatable = true;
            } else { repeatable = false; }
            if(data.users){
                var userFb = new Firebase(moduleDataFb + '/users/');
                userFb.on("child_added", function(snap){
                    var checkUser = snap.val();
                    if(checkUser.approved == false){
                        this.setState({ moduleInProgress: "true" })
                    }
                }.bind(this))
            }
            this.setState({ title: title, description: description, taxonomy: taxonomy, points: points, repeatable: repeatable });
        }.bind(this))
    },

    getModuleDataForStudent() {
        var userId = this.state.userId;
        var moduleId = this.state.id;
        var moduleUserFb = new Firebase(userFb + '/' + userId + '/modules/');
        var points, repeated, rejected, adminComment;

        moduleUserFb.once("value", function(snapshot) {
            if(snapshot.hasChild(moduleId)) {
                var submittedFb = new Firebase(moduleUserFb + '/' + moduleId);
                submittedFb.once("value", function(snap) {
                    var data = snap.val();
                    if(data.approved) {
                        points = data.points;
                        repeated = data.repeated;
                        this.setState({ approved: true, points: points, submitted: true, repeated: repeated })
                    } else if(data.rejected) {
                        this.rejectedDataFb = new Firebase(firebaseDb + '/' + moduleId + '/users/' + userId);
                        this.rejectedDataFb.once("value", function(rData) {
                            var item = rData.val();
                            this.setState({ submitted: true, points: points, approved: false,  repeated: "0", rejected: true, adminComment: item.adminComment })
                        }.bind(this))
                    } else (
                        this.setState({ submitted: true, points: points, approved: false, repeated: "0" })
                    )
                }.bind(this));
            } else (
                this.setState({ submitted: false, approved: false, repeated: "0" })
            )
        }.bind(this))
    },

    showAllModules() {
        this.transitionTo('moduleslist');
    },

    handleModuleSubmit(e) {
        e.preventDefault();
        this.handleValidation(res => {
            if(res){
                this.modulesApproval = new Firebase(firebaseDb + '/' + this.state.id + '/users/');
                this.modulesApproval.child(this.state.userId).set({comment: this.state.comment, solutionUrl: this.state.solutionUrl, approved: false});
                this.studentModuleFb.child(this.state.id).set({approved: false, repeated: this.state.repeated });
                this.setState({comment: '', solutionUrl: '', submitted: true, approved: false, rejected: false});
            }
        })
    },

    commentOnChange(e) {
        this.setState({comment: e.target.value, commentMessage:''});
    },

    solutionUrlOnChange(e) {
        this.setState({solutionUrl: e.target.value, solutionUrlMessage:''});
    },

    deleteModule() {
        var itemForRemoval = new Firebase(firebaseDb + '/' + this.state.id);
        itemForRemoval.update({
            status: 'inactive'
        })
        //itemForRemoval.remove();
        this.transitionTo('moduleslist');
    },

    editModule() {
        this.transitionTo('editmodule', null, { id: this.state.id });
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;

        if(this.state.comment.trim().length == 0){
            this.setState({ commentMessage: 'Enter comment.' });
            err = true;
        }

        if(this.state.solutionUrl.trim().length == 0){
            this.setState({ solutionUrlMessage: 'Enter solution url.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

	render() {
		return <div>
					<div className='headlineFont'><span>{this.state.title}</span> {this.state.points} points<span></span></div>
			        <div className='marginTop'>{this.state.description}</div>

                    {auth.isAdmin() ? (<AdminView onDelete = {this.deleteModule} onEdit = {this.editModule} inProgress = {this.state.moduleInProgress} />) : (<div></div>)}
                    {(!auth.isAdmin() && !this.state.approved && this.state.submitted && !this.state.rejected) ? (<div><span>Submitted, waiting for response from admin!</span></div>):(<div></div>)}
                    {this.state.rejected ? (<div>
                                                <div className='paddingTopBig errorMessage'>Your solution is rejected!</div>
                                                <div className='errorMessage'>Reason: {this.state.adminComment}</div>
                                                <div className='marginTop approved'>Review your code and submit for review again!</div>
                                                <div className='paddingTopBig'>
                                                    <form onSubmit={this.handleModuleSubmit}>
                                                       <div>Explain why you shoud be awarded points</div>
                                                       <input type = 'text' value={this.state.comment} onChange={this.commentOnChange}/>
                                                       <div>{this.state.commentMessage}</div>
                                                       <div className='marginTop'>URL (if applicable)</div>
                                                       <input type = 'text' value={this.state.solutionUrl} onChange={this.solutionUrlOnChange} />
                                                       <div>{this.state.solutionUrlMessage}</div>
                                                       <div className='marginTop'><button>Submit for review</button></div>
                                                   </form>
                                               </div>
                                           </div>
                        ):(<div></div>)}
                    {(!auth.isAdmin() && this.state.approved && !this.state.repeatable) ? (<div className='paddingTopBig approved'>This module is finished!</div>):(<div></div>)}
                    {((!auth.isAdmin() && !this.state.submitted) || (!auth.isAdmin() && this.state.approved && this.state.repeatable)) ? (
                        <div> {(this.state.repeatable && this.state.repeated > 1) ? (<span>Repeated {this.state.repeated} times</span>) : (<span></span>)}
                           <div className='paddingTopBig'>
                           <form onSubmit={this.handleModuleSubmit}>
                               <div>Explain why you shoud be awarded points</div>
                               <input type = 'text' value={this.state.comment} onChange={this.commentOnChange}/>
                               <div>{this.state.commentMessage}</div>
                               <div className='marginTop'>URL (if applicable)</div>
                               <input type = 'text' value={this.state.solutionUrl} onChange={this.solutionUrlOnChange} />
                               <div>{this.state.solutionUrlMessage}</div>
                               <div className='marginTop'><button>Submit for review</button></div>
                           </form>
                           </div>
                       </div>) : (<div></div>)}    
                    <div className='marginTop'><button onClick={this.showAllModules}>Show all modules</button></div>
                    {(!this.state.repeatable) ? (<div className='marginTop infoMessage'><span className='errorMessage'>*</span>&nbsp;&nbsp;<span>Module is not repeatable! </span></div>) : 
                    (<div className='marginTop infoMessage'><span className='errorMessage'>*</span>&nbsp;&nbsp;<span>Module is repeatable! </span></div>)}
				</div>;
	}
});

let AdminView = React.createClass({
    handleDelete() {
        this.props.onDelete(this);
    },

    handleEdit() {
        this.props.onEdit(this);
    },

    render() {
        return <div>
                    <button type='button' onClick={this.handleEdit}><i> Edit module </i></button>
                    {this.props.inProgress == "true" ? (<div className='marginTop infoMessage'><span className='errorMessage'>*</span>&nbsp;&nbsp;<span>Module is in progress so it cannot be deleted! </span></div>) : 
                    (<button type='button' onClick={this.handleDelete}><i> Delete module </i></button>)}
               </div>;
    }
});

export default PreviewModule;