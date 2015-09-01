import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//restrict points to numeric

let NewModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) {
      		this.transitionTo('login');
      	} else {
            var userStatus = auth.getStatus();
            var userId = auth.getUserId();
            if (userStatus == "created") {
                this.transitionTo('changepassword', null, {id: userId});
            }
        }
    
	  	return { title: '', description: '', taxonomy: [], taxonomySelected: 'General', points: '', repeatable: false, module: {}};
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules');
		this.taxonomyDb = new Firebase('https://app-todo-list.firebaseio.com/taxonomy');
		this.getTaxonomy();
	},

    componentWillUnmount() {
        this.firebaseDb.off();
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

	inputTitleTextChange(e) {
    	this.setState({title: e.target.value, titleMessage: '', message: ''});
	},

	inputDescriptionTextChange(e) {
    	this.setState({description: e.target.value, descriptionMessage: '', message: ''});
	},

	inputTaxonomyChange(e) {
    	this.setState({taxonomySelected: e.target.value});
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
					taxonomy: this.state.taxonomySelected,
					repeatable: this.state.repeatable,
					points: this.state.points,
                    status: 'active'
	            });
	            this.setState({title: '', description: '', taxonomy: '', taxonomySelected: 'General', repeatable: '', points: ''});
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

        if(this.state.points.trim().length == 0){
            this.setState({ pointsMessage: 'Enter points.' });
            err = true;
        }

        if(err){ response (false); return; } else { response (true); return; }
    },

	render() {
        if(this.state.taxonomy != ''){
            var optionNodes = this.state.taxonomy.map(function(option){
                    return <option value={option.value}>{option.name}</option>;
            });
        }    

		return <div>
			<form className= "newmodule-container newmodule-form" onSubmit={this.createModule} >
				<div><span>Title:</span>
		           <input type = 'text' value = { this.state.title } onChange = {this.inputTitleTextChange} />
		           <div>{this.state.titleMessage}</div>
		       </div>
		       <div><span>Description:</span>
		           <input type = 'text' value = { this.state.description } onChange = {this.inputDescriptionTextChange} />
		           <div>{this.state.descriptionMessage}</div>
		       </div>
				<div><span>Taxonomy:</span>
					<select value={this.state.taxonomySelected} onChange={this.inputTaxonomyChange}>
                        {optionNodes}
                    </select>
		        </div>
		        <div><span>Points:</span>
		            <input type = 'text' value = { this.state.points } onChange = {this.inputPointsTextChange} />
		            <div>{this.state.pointsMessage}</div>
		        </div>
		        <div><span>Repeatable:</span>
		            <input type = 'checkbox' checked = { this.state.repeatable } onChange = {this.checkboxRepeatableChange} />
		        </div>
                <div><span><button className="form-button newmodule-button newmodule-button-create">Create module</button></span></div>
                <div><span><button className="form-button newmodule-button newmodule-button-create" onClick = {this.cancel}>Cancel</button></span></div>
			</form>
		</div>;
	}
});

module.exports = NewModule;