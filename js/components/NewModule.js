import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

let NewModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) {
      		this.transitionTo('login');
      	};
		this.module = {};
	  	return { title: '', description: '', taxonomy: '', points: '', repeatable: false, module: {}};
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules');
	},

    componentWillUnmount() {
        this.firebaseDb.off();
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
    	this.setState({repeatable: e.target.checked}); //change this
	},

	createModule(e) {
        e.preventDefault();
        if (this.state.title.trim().length !== 0) {
            this.firebaseDb.push({
                title: this.state.title,
				description: this.state.description,
				taxonomy: this.state.taxonomy,
				repeatable: this.state.repeatable,
				points: this.state.points
            });
            this.setState({title: ""});
			this.setState({description: ""});
			this.setState({taxonomy: ""}); 
			this.setState({repeatable: ""});
			this.setState({points: ""});
			this.transitionTo('moduleslist');
        };
    },

    cancel() {
    	this.transitionTo('moduleslist');
    },

	render() {
		return <div>
					<form onSubmit={this.createModule} >
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
	                    <div><span><button>Create module</button></span></div>
					</form>
					<div><span><button onClick = {this.cancel}>Cancel</button></span></div>
				</div>;
	}
});

module.exports = NewModule;