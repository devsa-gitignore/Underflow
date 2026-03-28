import asyncHandler from 'express-async-handler';
import * as visitService from '../services/visit.service.js';

// @desc    Create a new patient visit
// @route   POST /patients/:id/visits
// @access  Private
export const createVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.createVisit(
    req.params.id,
    req.user._id,
    req.body
  );
  res.status(201).json(visit);
});

// @desc    Get all visits of a patient
// @route   GET /patients/:id/visits
// @access  Private
export const getVisits = asyncHandler(async (req, res) => {
  const visits = await visitService.getVisitsByPatient(req.params.id);
  res.status(200).json(visits);
});

// @desc    Get the latest visit of a patient
// @route   GET /patients/:id/visits/latest
// @access  Private
export const getLatestVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.getLatestVisit(req.params.id);
  if (!visit) {
    res.status(404);
    throw new Error('No visits found for this patient');
  }
  res.status(200).json(visit);
});

// @desc    Add or update vitals of the latest visit today
// @route   POST /patients/:id/vitals
// @access  Private
export const addVitals = asyncHandler(async (req, res) => {
  const visit = await visitService.addVitalsToVisit(req.params.id, req.body);
  res.status(200).json(visit);
});
