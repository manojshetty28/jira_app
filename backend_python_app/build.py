from pybuilder.core import init, use_plugin


use_plugin("python.core")
use_plugin("python.install_dependencies")
use_plugin("python.unittest")
use_plugin("python.coverage")

name = "backend_python_app"
version = "1.0.dev0"
summary = "FastAPI backend for fetching live gold prices from Metals.dev"
default_task = "publish"


@init
def set_properties(project):
    project.set_property("dir_source_main_python", "src/main/python")
    project.set_property("dir_source_unittest_python", "src/unittest/python")
    project.set_property("coverage_break_build", True)
    project.set_property("coverage_threshold_warn", 100)
    project.set_property("coverage_branch_threshold_warn", 100)
    project.set_property("coverage_branch_partial_threshold_warn", 100)

    # Runtime dependencies are declared in a plain pip requirements file for local setup parity.
    project.depends_on_requirements("requirements.txt")
