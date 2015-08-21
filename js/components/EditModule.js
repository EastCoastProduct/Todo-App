import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules');

let EditModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) {
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
    	this.setState({repeatable: e.target.checked});
	},

    cancel() {
        this.transitionTo('moduleslist');
    },

    editModule(e) {
        e.preventDefault();
        this.handleValidation(res => {
            if(res){
                var moduleFb = new Firebase(firebaseDb + '/' + this.state.id)
                moduleFb.update({ 
                    title: this.state.title, 
                    description: this.state.description,
                    taxonomy: this.state.taxonomy,
                    points: this.state.points,
                    repeatable: this.state.repeatable
                });
                this.transitionTo('previewmodule', null, { id: this.state.id });
            }
        })
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
					<form onSubmit={this.editModule} >
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
	                    <div><span><button>Update module</button></span></div>
					</form>
                    <div><span><button onClick = {this.cancel}>Cancel</button></span></div>
				</div>;
	}
});

module.exports = EditModule;