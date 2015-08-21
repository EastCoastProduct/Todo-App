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
    	this.setState({title: e.target.value, titleMessage: '', message: ''});
	},

	inputDescriptionTextChange(e) {
    	this.setState({description: e.target.value, descriptionMessage: '', message: ''});
	},

	inputTaxonomyTextChange(e) {
    	this.setState({taxonomy: e.target.value, taxonomyMessage: '', message: ''});
	},

	inputPointsTextChange(e) {
    	this.setState({points: e.target.value, pointsMessage: '', message: ''});
	},

	checkboxRepeatableChange(e) {
    	this.setState({repeatable: e.target.checked}); //change this
	},

	createModule(e) {
        e.preventDefault();
        this.handleValidation(res => {
            if(res){
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
        	}
    	})
    },

    cancel() {
    	this.transitionTo('moduleslist');
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;

        if(this.state.title.trim().length == 0){
            this.setState({ titleMessage: 'Enter title.' });
            err = true;
        }

        if(this.state.description.trim().length == 0){
            this.setState({ descriptionMessage: 'Enter description.' });
            err = true;
        }

        if(this.state.taxonomy.trim().length == 0){
            this.setState({ taxonomyMessage: 'Enter taxonomy.' });
            err = true;
        }

        if(this.state.points.trim().length == 0){
            this.setState({ pointsMessage: 'Enter points.' });
            err = true;
        }

        if(err){ response (false); return; } else { response (true); return; }
    },

	render() {
		return <div>
					<form onSubmit={this.createModule} >
						<div><span>Title:</span>
				           <input type = 'text' value = { this.state.title } onChange = {this.inputTitleTextChange} />
				           <div>{this.state.titleMessage}</div>
				       </div>
				       <div><span>Description:</span>
				           <input type = 'text' value = { this.state.description } onChange = {this.inputDescriptionTextChange} />
				           <div>{this.state.descriptionMessage}</div>
				       </div>
						<div><span>Taxonomy:</span>
				            <input type = 'text' value = { this.state.taxonomy } onChange = {this.inputTaxonomyTextChange} />
				            <div>{this.state.taxonomyMessage}</div>
				        </div>
				        <div><span>Points:</span>
				            <input type = 'text' value = { this.state.points } onChange = {this.inputPointsTextChange} />
				            <div>{this.state.pointsMessage}</div>
				        </div>
				        <div><span>Repeatable:</span>
				            <input type = 'checkbox' checked = { this.state.repeatable } onChange = {this.checkboxRepeatableChange} />
				        </div>
	                    <div><span><button>Create module</button></span></div>
	                    <div><span><button onClick = {this.cancel}>Cancel</button></span></div>
					</form>
				</div>;
	}
});

module.exports = NewModule;