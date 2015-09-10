import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let PreviewModuleForApproval = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
		return { moduleId: this.props.params.moduleId, studentId: this.props.params.studentId, approved: false, adminComment: '', solutionUrl: '' };
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
        this.usersFb.once('value', function(snap){
            var user = snap.val();
            this.setState({usersData: user.first_name + ' ' + user.last_name});
        }.bind(this))
        this.moduleFb.once('value', function(snapshot){
            var data = snapshot.val();
            this.setState({ title: data.title, description: data.description, taxonomy: data.taxonomy, points:data.points, repeatable: data.repeatable });
        }.bind(this));
        this.moduleApprovalFb.once('value', function(snapshot){
            var data = snapshot.val();
            this.setState({ comment: data.comment, solutionUrl: data.solutionUrl });
            if (data.adminComment) {
                this.setState({
                    adminComment: data.adminComment,
                    rejected: true
                })
            }
        }.bind(this));
    }, 

    showAllModules() {
        this.transitionTo('moduleslist');
    },

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
                this.moduleApprovalFb.set({ //put here update and only approved:true
                    approved: true,
                    comment: this.state.comment,
                    solutionUrl: this.state.solutionUrl
                });
                this.studentFb.set({
                    approved: true,
                    points: this.state.points,
                    repeated: newRepeate,
                    title: this.state.title
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
                    repeated: "1",
                    title: this.state.title
                });
                this.setState({ approved: true,  })
            }
        }.bind(this))
    },

    adminCommentOnChange(e) {
        this.setState({adminComment: e.target.value, adminCommentMessage:''});
    },

    rejectModule(e) {
        e.preventDefault();
        this.handleValidation(res => {
            if(res){
                this.moduleApprovalFb.update({
                    approved: false,
                    adminComment: this.state.adminComment,
                    rejected: true
                });
                this.studentFb.update({
                    rejected: true
                })
                this.setState({ approved: false, adminComment: '', rejected: true })
            }
        })
    },

    commentOnChange(e) {
        this.setState({comment: e.target.value});
    },

    solutionUrlOnChange(e) {
        this.setState({solutionUrl: e.target.value});
    },

    handleModuleSubmit(e) {
        e.preventDefault();
        this.moduleApprovalFb.update({
            comment: this.state.comment,
            solutionUrl: this.state.solutionUrl,
            approved: false
        });
        this.setState({
            comment: '',
            solutionUrl: '',
            submitted: true,
            approved: false,
            rejected: false
        });
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;

        if(this.state.adminComment.trim().length == 0){
            this.setState({ adminCommentMessage: 'Enter reason for rejection.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

	render() {
		return  <div>
                    <div className='headlineFont paddingLeft'><span>{this.state.title}</span><span> {this.state.points} points</span><span> {this.state.points} points</span>{auth.isAdmin() ? (<div>{this.state.usersData}</div>):(<div></div>)}</div>
                    <div className='marginTop paddingLeft'>{this.state.description}</div>
                    <div>
                        {(!auth.isAdmin() && !this.state.approved && !this.state.rejected) ? (<div className='marginTopBig paddingLeft approved'>Module submitted, waiting for response from administrator!</div>) : (<div></div>)}
                        <div className='marginTopBig paddingLeft'><b>Submission info</b></div><div className='paddingLeft'>{this.state.comment}</div>
                        {this.state.solutionUrl != '' ? (<div className='paddingLeft marginTop'>{this.state.solutionUrl}</div>):(<div></div>)}
                        <div>
                        {auth.isAdmin() ? ((!this.state.approved && !this.state.rejected) ? (
                            <div className='marginTop'>
                                <div className='paddingLeft'><button className='button_example' onClick={this.approveModule}>Approve solution</button></div>
                                <div className='marginTop' id='changeData-form'>
                                    <fieldset>
                                        <form onSubmit={this.rejectModule}>
                                           <div className='fontSmall'>Reason for rejection:</div>
                                           <textarea rows={8} value={this.state.adminComment} onChange={this.adminCommentOnChange}/>
                                           <div className='errorMessage'>{this.state.adminCommentMessage}</div>
                                           <input type='submit' value='Reject solution'/>
                                        </form>
                                    </fieldset>
                                </div>
                            </div>) : (<span></span>)) : (<div></div>)}
                        {auth.isAdmin() ? ((!this.state.approved && this.state.rejected) ? (
                            <div className='errorMessage paddingLeft marginTop'>Solution is rejected! <div className='errorMessage'><b>Reason:</b> {this.state.comment}</div></div>) : (<span></span>)) : (<div></div>)}
                        {auth.isAdmin() ? (this.state.approved) ? (
                            <div className='approved paddingLeft marginTop'>Solution is approved!</div>) : (<span></span>) : (<div></div>)}
                        {(!auth.isAdmin() && this.state.approved && !this.state.rejected) ? (<span>Module finished!</span>) : (<span></span>)}
                        </div>
                    </div>
                    <div>
                        <div className='paddingLeft marginTopBig'><button className="button_example" onClick={this.showAllModules}>Show all modules</button></div>
    				</div>
                </div>;
	}
});

export default PreviewModuleForApproval;