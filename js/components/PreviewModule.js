import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules/');
var userFb = new Firebase('https://app-todo-list.firebaseio.com/users/');

// what if admin deletes module which is waiting for approval
// show preview of user's comment and url and if admin leaves some message

let PreviewModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { id: this.props.query.id, userId: auth.getUserId(), submitted: false };
	},

	componentWillMount() {
        this.studentModuleFb = new Firebase(userFb + '/' + this.state.userId + '/modules/');
        this.getBasicModuleData();
        if(!auth.isAdmin()) {
            this.getModuleDataForStudent();
        }
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
            if(data.repeatable) {
                repeatable = true;
            } else {
                repeatable = false;
            }
            this.setState({ title: title, description: description, taxonomy: taxonomy, points: points, repeatable: repeatable });
        }.bind(this))
    },

    getModuleDataForStudent() {
        var userId = this.state.userId;
        var moduleId = this.state.id;
        var moduleUserFb = new Firebase(userFb + '/' + userId + '/modules/');
        var points, repeated;

        moduleUserFb.once("value", function(snapshot) {
            if(snapshot.hasChild(moduleId)) {
                var submittedFb = new Firebase(moduleUserFb + '/' + moduleId);
                submittedFb.once("value", function(snap) {
                    var data = snap.val();
                    if(data.approved) {
                        points = data.points;
                        repeated = data.repeated;
                        this.setState({
                            approved: true,
                            points: points,
                            submitted: true,
                            repeated: repeated
                        })
                    } else (
                        this.setState({
                            submitted: true,
                            points: points,
                            approved: false, 
                            repeated: "0"
                        })
                    )
                }.bind(this));
            } else (
                this.setState({
                    submitted: false,
                    approved: false, 
                    repeated: "0"
                })
            )
        }.bind(this))
    },

    showAllModules() {
        this.transitionTo('moduleslist');
    },

    handleModuleSubmit(e) {
        e.preventDefault();
        this.modulesApproval = new Firebase(firebaseDb + '/' + this.state.id + '/users/');
        this.modulesApproval.child(this.state.userId).set({
            comment: this.state.comment,
            solutionUrl: this.state.solutionUrl,
            approved: false
        });
        this.studentModuleFb.child(this.state.id).set({
            approved: false,
            repeated: this.state.repeated
        });
        this.setState({
            comment: '',
            solutionUrl: '',
            submitted: true,
            approved: false
        });
    },

    commentOnChange(e) {
        this.setState({comment: e.target.value});
    },

    solutionUrlOnChange(e) {
        this.setState({solutionUrl: e.target.value});
    },

    deleteModule() {
        var itemForRemoval = new Firebase(firebaseDb + '/' + this.state.id);
        itemForRemoval.remove();
        this.transitionTo('moduleslist');
    },

    editModule() {
        this.transitionTo('editmodule', null, { id: this.state.id });
    },

	render() {
		return <div>
					<div><span>Title:</span>
			           <div>{ this.state.title }</div>
			       </div>
			       <div><span>Description:</span>
			           <div>{ this.state.description }</div>
			       </div>
					<div><span>Taxonomy:</span>
			            <div>{ this.state.taxonomy }</div>
			        </div>
                    <div><span>Points:</span>
                        <div>{ this.state.points }</div>
                    </div>
			        <div><span>Repeatable:</span>
			            <div>{ String(this.state.repeatable) }</div>
			        </div>
                    {auth.isAdmin() ? (<AdminView onDelete = {this.deleteModule} onEdit = {this.editModule}/>) : (<div></div>)}
                    {(!auth.isAdmin() && !this.state.approved && this.state.submitted) ? (<div><span>Submitted, waiting for response from admin!</span></div>):(<div></div>)}
                    {(!auth.isAdmin() && this.state.approved && !this.state.repeatable) ? (<div><span>This module is finished!</span></div>):(<div></div>)}
                    {((!auth.isAdmin() && !this.state.submitted) || (!auth.isAdmin() && this.state.approved && this.state.repeatable)) ? (
                        <div> {(this.state.repeatable && this.state.repeated > 1) ? (<span>Repeated {this.state.repeated} times</span>) : (<span></span>)}
                           <form onSubmit={this.handleModuleSubmit}>
                               <span>Comment:</span>
                               <input type = 'text' value={this.state.comment} onChange={this.commentOnChange}/>
                               <span>Solution url:</span>
                               <input type = 'text' value={this.state.solutionUrl} onChange={this.solutionUrlOnChange} />
                               <div><span><button>Submit module</button></span></div>
                           </form>
                       </div>) : (<div></div>)}    
                    <div><span><button onClick={this.showAllModules}>Show all modules</button></span></div>
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
                    <button type='button' onClick={this.handleEdit}>
                        <i> Edit module </i>
                    </button>
                    <button type='button' onClick={this.handleDelete}>
                        <i> Delete module </i>
                    </button>
               </div>;
    }
});

module.exports = PreviewModule;