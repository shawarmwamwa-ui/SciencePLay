/**
 * Teacher Paired Lessons & Activities Assignment Logic
 * SciencePlay Teacher Portal
 */

document.addEventListener('DOMContentLoaded', function () {
  const mapElem = document.getElementById('lessonActivityMapData');
  const assignElem = document.getElementById('existingAssignmentsData');

  if (!mapElem || !assignElem) return;

  let lessonActivityMap = {};
  let existingAssignments = { lessons: [], activities: [] };

  try {
    lessonActivityMap = JSON.parse(mapElem.textContent);
  } catch (e) {
    console.error('Error parsing lessonActivityMapData:', e);
  }

  try {
    existingAssignments = JSON.parse(assignElem.textContent);
  } catch (e) {
    console.error('Error parsing existingAssignmentsData:', e);
  }

  const studentSelect = document.getElementById('assignStudentSelect');
  const lessonSelect = document.getElementById('assignLessonSelect');
  const detailsArea = document.getElementById('assignmentDetailsArea');
  const pairedRow = document.getElementById('pairedActivityRow');
  const noPairedNote = document.getElementById('noPairedActivityNote');
  const pairedNameText = document.getElementById('pairedActivityNameText');
  const pairedIdInput = document.getElementById('pairedActivityIdInput');
  const includeActivityCheck = document.getElementById('includeActivityCheck');
  const duplicateWarning = document.getElementById('duplicateWarning');
  const duplicateWarningText = document.getElementById('duplicateWarningText');
  const submitBtn = document.getElementById('assignSubmitBtn');
  const btnText = document.getElementById('assignBtnText');

  function updateAssignmentFormState() {
    if (!studentSelect || !lessonSelect) return;
    const studentId = parseInt(studentSelect.value, 10);
    const lessonId = lessonSelect.value;

    if (!lessonId) {
      if (detailsArea) detailsArea.style.display = 'none';
      if (duplicateWarning) duplicateWarning.style.setProperty('display', 'none', 'important');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.className = 'btn btn-primary w-100 py-2 fw-semibold';
      }
      if (btnText) btnText.textContent = 'Assign Lesson';
      return;
    }

    if (detailsArea) detailsArea.style.display = 'block';
    const pairedData = lessonActivityMap[lessonId];

    if (pairedData) {
      if (pairedRow) {
        pairedRow.classList.remove('d-none');
        pairedRow.classList.add('d-flex');
      }
      if (noPairedNote) {
        noPairedNote.classList.remove('d-flex');
        noPairedNote.classList.add('d-none');
      }
      if (pairedNameText) pairedNameText.textContent = pairedData.name;
      if (pairedIdInput) pairedIdInput.value = pairedData.id;
      if (includeActivityCheck) includeActivityCheck.disabled = false;
    } else {
      if (pairedRow) {
        pairedRow.classList.remove('d-flex');
        pairedRow.classList.add('d-none');
      }
      if (noPairedNote) {
        noPairedNote.classList.remove('d-none');
        noPairedNote.classList.add('d-flex');
      }
      if (pairedNameText) pairedNameText.textContent = '';
      if (pairedIdInput) pairedIdInput.value = '';
      if (includeActivityCheck) {
        includeActivityCheck.checked = false;
        includeActivityCheck.disabled = true;
      }
    }

    if (!studentId || studentSelect.value === 'all') {
      if (duplicateWarning) duplicateWarning.style.setProperty('display', 'none', 'important');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.className = 'btn btn-primary w-100 py-2 fw-semibold';
      }
      const isAll = studentSelect.value === 'all';
      if (btnText) {
        btnText.textContent = (pairedData && includeActivityCheck && includeActivityCheck.checked) 
          ? (isAll ? 'Assign Both to ALL Students' : 'Assign Lesson & Activity') 
          : (isAll ? 'Assign Lesson to ALL Students' : 'Assign Lesson');
      }
      return;
    }

    const isLessonAssigned = existingAssignments.lessons && existingAssignments.lessons.some(
      a => a.student_id === studentId && a.lesson_id === parseInt(lessonId, 10)
    );

    const existingActObj = (pairedData && existingAssignments.activities) ? existingAssignments.activities.find(
      a => a.student_id === studentId && a.activity_id === pairedData.id
    ) : null;

    const isActivityActive = existingActObj ? (existingActObj.status === 'assigned') : false;
    const isActivityExhausted = existingActObj ? (existingActObj.status === 'attempts_exhausted' || existingActObj.status === 'completed') : false;

    const studentName = studentSelect.options[studentSelect.selectedIndex] ? studentSelect.options[studentSelect.selectedIndex].text.split('(')[0].trim() : 'Student';
    const lessonTitle = lessonSelect.options[lessonSelect.selectedIndex] ? lessonSelect.options[lessonSelect.selectedIndex].text.trim() : 'Lesson';

    if (pairedData && isActivityExhausted && includeActivityCheck && includeActivityCheck.checked) {
      duplicateWarning.className = 'alert alert-info d-flex align-items-center py-2 px-3 mb-0 mt-1';
      duplicateWarning.style.setProperty('display', 'flex', 'important');
      duplicateWarningText.innerHTML = `<i class="bi bi-arrow-repeat me-2 text-primary fs-5"></i><span><strong>${studentName}</strong> has used attempts on "<strong>${pairedData.name}</strong>". Click below to reassign it with 3 fresh attempts.</span>`;
      submitBtn.disabled = false;
      submitBtn.className = 'btn btn-primary w-100 py-2 fw-semibold';
      btnText.textContent = 'Reassign Paired Activity';
    } else if (isLessonAssigned && isActivityActive) {
      duplicateWarning.className = 'alert alert-warning d-flex align-items-center py-2 px-3 mb-0 mt-1';
      duplicateWarning.style.setProperty('display', 'flex', 'important');
      duplicateWarningText.textContent = `Both "${lessonTitle}" and "${pairedData.name}" are currently actively assigned to ${studentName}.`;
      submitBtn.disabled = true;
      submitBtn.className = 'btn btn-secondary w-100 py-2 fw-semibold';
      btnText.textContent = 'Already Actively Assigned';
    } else if (isLessonAssigned && pairedData && !existingActObj) {
      if (includeActivityCheck && includeActivityCheck.checked) {
        duplicateWarning.className = 'alert alert-info d-flex align-items-center py-2 px-3 mb-0 mt-1';
        duplicateWarning.style.setProperty('display', 'flex', 'important');
        duplicateWarningText.innerHTML = `<i class="bi bi-info-circle-fill me-2 text-info fs-5"></i><span><strong>"${lessonTitle}"</strong> is already assigned to ${studentName}. Click below to assign the paired activity <strong>"${pairedData.name}"</strong>.</span>`;
        submitBtn.disabled = false;
        submitBtn.className = 'btn btn-primary w-100 py-2 fw-semibold';
        btnText.textContent = 'Assign Paired Activity';
      } else {
        duplicateWarning.className = 'alert alert-warning d-flex align-items-center py-2 px-3 mb-0 mt-1';
        duplicateWarning.style.setProperty('display', 'flex', 'important');
        duplicateWarningText.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2 text-warning fs-5"></i><span>"${lessonTitle}" is already assigned to ${studentName}. Turn on the switch above to assign the paired activity.</span>`;
        submitBtn.disabled = true;
        submitBtn.className = 'btn btn-secondary w-100 py-2 fw-semibold';
        btnText.textContent = 'Lesson Already Assigned';
      }
    } else if (isLessonAssigned && !pairedData) {
      duplicateWarning.className = 'alert alert-warning d-flex align-items-center py-2 px-3 mb-0 mt-1';
      duplicateWarning.style.setProperty('display', 'flex', 'important');
      duplicateWarningText.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2 text-warning fs-5"></i><span>"${lessonTitle}" is already assigned to ${studentName}.</span>`;
      submitBtn.disabled = true;
      submitBtn.className = 'btn btn-secondary w-100 py-2 fw-semibold';
      btnText.textContent = 'Already Assigned';
    } else if (!isLessonAssigned && pairedData && isActivityActive && includeActivityCheck && includeActivityCheck.checked) {
      duplicateWarning.className = 'alert alert-info d-flex align-items-center py-2 px-3 mb-0 mt-1';
      duplicateWarning.style.setProperty('display', 'flex', 'important');
      duplicateWarningText.innerHTML = `<i class="bi bi-info-circle-fill me-2 text-info fs-5"></i><span>Note: Paired activity "<em>${pairedData.name}</em>" is already active for ${studentName}. Only the lesson will be newly assigned.</span>`;
      submitBtn.disabled = false;
      submitBtn.className = 'btn btn-primary w-100 py-2 fw-semibold';
      btnText.textContent = 'Assign Lesson';
    } else {
      duplicateWarning.style.setProperty('display', 'none', 'important');
      submitBtn.disabled = false;
      submitBtn.className = 'btn btn-primary w-100 py-2 fw-semibold';
      btnText.textContent = (pairedData && includeActivityCheck && includeActivityCheck.checked) ? 'Assign Lesson & Activity' : 'Assign Lesson';
    }
  }

  if (studentSelect) studentSelect.addEventListener('change', updateAssignmentFormState);
  if (lessonSelect) lessonSelect.addEventListener('change', updateAssignmentFormState);
  if (includeActivityCheck) includeActivityCheck.addEventListener('change', updateAssignmentFormState);

  // Quick-fill buttons from Lesson Library table
  document.querySelectorAll('.quick-fill-lesson-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const lid = this.getAttribute('data-lesson-id');
      if (lessonSelect && lid) {
        lessonSelect.value = lid;
        updateAssignmentFormState();
        const card = document.getElementById('create-assignment-card');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          card.classList.add('section-anchor-highlight');
          setTimeout(() => card.classList.remove('section-anchor-highlight'), 2000);
        }
      }
    });
  });

  // Initial state check
  updateAssignmentFormState();
});
