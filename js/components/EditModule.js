import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules');

let EditModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) { //if not admin, show message that he doesn't have rights
      		console.log("redirect to login");
      		this.transitionTo('login');
      	};
		return { id: this.props.query.id, title: '', description: '', taxonomy: '', points:'', repeatable: false };
	},

	componentWillMount() {
        this.getModuleData();
    },

    getModuleData() {
        var id = this.state.id;
        var moduleFb = new Firebase(firebaseDb + '/' + id);
        var title, description, taxonomy, points, repeatable;

        moduleFb.once('value', function(snapshot){
            var data = snapshot.val();
            title = data.title;
            description = data.description;
            taxonomy = data.taxonomy;
            points = data.points;
            repeatable = data.repeatable;
            this.setState({ title: title, description: description, taxonomy: taxonomy, points: points, repeatable: repeatable });
        }.bind(this))
    },

    componentWillUnmount() {
        firebaseDb.off();
    },

	inputTitleTextChange(e) {
    	this.setState({title: e.target.value});
	},

	inputDescriptionTextChange(e) {
    	this.setState({description: e.target.value});
	},

	inputTaxonomyTextChange(e) {
    	this.setState({taxonomy: e.target.value});
	},

    inputPointsTextChange(e) {
        this.setState({points: e.target.value});
    },

	checkboxRepeatableChange(e) {
    	this.setState({repeatable: e.target.checked});
	},

    cancel() {
        this.transitionTo('moduleslist');
    },

    editModule(e) {
        e.preventDefault();
        if (this.state.title.trim().length !== 0) {
            var moduleFb = new Firebase(firebaseDb + '/' + this.state.id)
            moduleFb.update({ 
                title: this.state.title, 
                description: this.state.description,
                taxonomy: this.state.taxonomy,
                points: this.state.points,
                repeatable: this.state.repeatable
            });
        };
        this.transitionTo('previewmodule', null, { id: this.state.id });
    },

	render() {
		return <div>
					<form onSubmit={this.editModule} >
						<div><span>Title:</span>
				           <input type = 'text' value = { this.state.title } onChange = {this.inputTitleTextChange} />
				       </div>
				       <div><span>Description:</span>
				           <input type = 'text' value = { this.state.description } onChange = {this.inputDescriptionTextChange} />
				       </div>
						<div><span>Taxonomy:</span>
				            <input type = 'text' value = { this.state.taxonomy } onChange = {this.inputTaxonomyTextChange} />
				        </div>
                        <div><span>Points:</span>
                            <input type = 'text' value = { this.state.points } onChange = {this.inputPointsTextChange} />
                        </div>
				        <div><span>Repeatable:</span>
				            <input type = 'checkbox' checked = { this.state.repeatable } onChange = {this.checkboxRepeatableChange} />
				        </div>
	                    <div><span><button>Update module</button></span></div>
					</form>
                    <div><span><button onClick = {this.cancel}>Cancel</button></span></div>
				</div>;
	}
});

module.exports = EditModule;