import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//add admin comment

let PreviewModuleForApproval = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { moduleId: this.props.query.moduleId, studentId: this.props.query.studentId, approved: false };
	},

	componentWillMount() {
        this.moduleFb = new Firebase('https://app-todo-list.firebaseio.com/modules/' + this.state.moduleId);
        this.usersFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.studentId);
        this.moduleApprovalFb = new Firebase(this.moduleFb + '/users/' + this.state.studentId);
        this.pointsFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.studentId + '/modules/');
        this.studentFb = new Firebase(this.pointsFb + '/' + this.state.moduleId);
        this.getModuleData();
    },

    componentWillUnmount() {
        this.moduleFb.off();
        this.moduleApprovalFb.off();
    },

    getModuleData() {
        this.moduleFb.once('value', function(snapshot){
            var data = snapshot.val();
            this.setState({ title: data.title, description: data.description, taxonomy: data.taxonomy, points:data.points, repeatable: data.repeatable });
        }.bind(this));
        this.moduleApprovalFb.once('value', function(snapshot){
            var data = snapshot.val();
            this.setState({ comment: data.comment, solutionUrl: data.solutionUrl });
        }.bind(this));
    }, 

    showAllModules() {
        this.transitionTo('moduleslist');
    },
    /*
    adminCommentOnChange(e) {
        this.setState({comment: e.target.value});
    },*/

    approveModule() {
        this.usersFb.once("value", function(snapshot) {
            var pointsData = snapshot.val();
            if(snapshot.hasChild("total_points")){
                var oldPoints = parseInt(pointsData.total_points);
                var newPoints = String(oldPoints + parseInt(this.state.points));
                this.usersFb.update({
                    total_points: newPoints
                })
            } else (
                this.usersFb.update({
                    total_points: this.state.points
                })
            )
        }.bind(this))

        this.studentFb.once("value", function(snap){
            var data = snap.val();
            if (snap.hasChild("repeated")){
                var oldRepeated = parseInt(data.repeated);
                var newRepeate = String(oldRepeated + 1);
                this.moduleApprovalFb.set({
                    approved: true,
                    comment: this.state.comment,
                    solutionUrl: this.state.solutionUrl
                });
                this.studentFb.set({
                    approved: true,
                    points: this.state.points,
                    repeated: newRepeate
                });
                this.setState({ approved: true })
            } else {
                this.moduleApprovalFb.set({
                    approved: true,
                    comment: this.state.comment,
                    solutionUrl: this.state.solutionUrl
                });
                this.studentFb.set({
                    approved: true,
                    points: this.state.points,
                    repeated: "1"
                });
                this.setState({ approved: true })
            }
        }.bind(this))
    },

    /*rejectModule() {

    },*/

	render() {
		return  <div>
                    <div>
                        <span>Submission info:</span>
                        <div><span>Comment:</span>
                           <div>{this.state.comment}</div>
                       </div>
                       <div><span>Solution url:</span>
                           <div>{this.state.solutionUrl}</div>
                       </div>
                        <div>
                        {auth.isAdmin() ? (!this.state.approved ? (<span><button onClick={this.approveModule}>Approve</button></span>) : (
                            <span>Module approved</span>
                            )) : (
                        !this.state.approved ? (<span>Module submitted, waiting for response from admin!</span>) : (
                            <span>Module approved</span>
                            )
                        )}
                        
                        </div>
                    </div>
                    <div>
                        <span>Module info:</span>
    					<div><span>Title:</span>
    			           <div>{this.state.title}</div>
    			       </div>
    			       <div><span>Description:</span>
    			           <div>{this.state.description}</div>
    			       </div>
    					<div><span>Taxonomy:</span>
    			            <div>{this.state.taxonomy}</div>
    			        </div>
                        <div><span>Points:</span>
                            <div>{this.state.points}</div>
                        </div>
    			        <div><span>Repeatable:</span>
    			            <div>{String(this.state.repeatable)}</div>
    			        </div>
                        <div><span><button onClick={this.showAllModules}>Show all modules</button></span></div>
    				</div>
                </div>;
	}
});

module.exports = PreviewModuleForApproval;