import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';

//restrict points to numeric

var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/modules');

let EditModule = React.createClass({
	mixins: [Router.Navigation],

	getInitialState() {
      	if (!auth.loggedIn()) {
      		this.transitionTo('login');
      	};
		return { id: this.props.query.id, title: '', description: '', taxonomy: [], taxonomySelected: '', points:'', repeatable: false };
	},

	componentWillMount() {
        this.taxonomyDb = new Firebase('https://app-todo-list.firebaseio.com/taxonomy');
        this.getModuleData();
        this.getTaxonomy();
    },

    getModuleData() {
        var id = this.state.id;
        var moduleFb = new Firebase(firebaseDb + '/' + id);
        var title, description, taxonomySelected, points, repeatable;

        moduleFb.once('value', function(snapshot){
            var data = snapshot.val();
            title = data.title;
            description = data.description;
            taxonomySelected = data.taxonomy;
            points = data.points;
            repeatable = data.repeatable;
            this.setState({ title: title, description: description, taxonomySelected: taxonomySelected, points: points, repeatable: repeatable });
        }.bind(this))
    },

    getTaxonomy(){
        this.taxonomyDb.on('child_added', function(snap){
            var taxonomyArray = this.state.taxonomy;
            var data = snap.val();
            data.id = snap.key();
            taxonomyArray.push(data);
            this.setState({taxonomy: taxonomyArray})
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

	inputTaxonomyChange(e) {
        this.setState({taxonomySelected: e.target.value});
    },

    inputPointsTextChange(e) {
        this.setState({points: e.target.value, pointsMessage: '', message: ''});
    },

	checkboxRepeatableChange(e) {
    	this.setState({repeatable: e.target.checked});
	},

    //cancel() {
    //    this.transitionTo('moduleslist');
    //},

    editModule(e) {
        e.preventDefault();
        this.handleValidation(res => {
            if(res){
                var moduleFb = new Firebase(firebaseDb + '/' + this.state.id)
                moduleFb.update({ 
                    title: this.state.title, 
                    description: this.state.description,
                    taxonomy: this.state.taxonomySelected,
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

        if(this.state.points.trim().length == 0){
            this.setState({ pointsMessage: 'Enter points.' });
            err = true;
        }

        if(err){ response (false); return; } else { response (true); return; }
    },

	render() {
        var optionNodes = this.state.taxonomy.map(function(option){
                return <option value={option.value}>{option.name}</option>;
        });

		return <div id='changeData-form'>
                <fieldset>
					<form onSubmit={this.editModule} >
				           <input type='text' placeholder='Title' value={this.state.title} onChange={this.inputTitleTextChange} />
                           <div className='errorMessage'>{this.state.titleMessage}</div>
                           <input type='text' placeholder='Points' value={this.state.points} onChange={this.inputPointsTextChange} />
                            <div className='errorMessage'>{this.state.pointsMessage}</div>
				           <textarea rows={8} placeholder='Description' value={this.state.description} onChange={this.inputDescriptionTextChange} />
                           <div className='errorMessage'>{this.state.descriptionMessage}</div>
                           <select className='adminFont' value={this.state.taxonomySelected} onChange={this.inputTaxonomyChange}>{optionNodes}</select>
                           <div className='paddingAll'><span className='adminFont'>Repeatable</span>
                               <input type ='checkbox' checked={this.state.repeatable} onChange={this.checkboxRepeatableChange} />
                           </div>
                        <input type='submit' value='Update module'/>
					</form>
                </fieldset>
			   </div>;
	}
});
export default EditModule;